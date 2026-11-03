---
title: Interrupt and resume from a UI
slug: interrupt-from-a-ui
description: Wire a Stop button to a running agent, carry on later, and free the session when a stream is abandoned.
order: 4
metaTitle: "Interrupt and resume an agent from a UI"
metaDescription: "Stop a running agent with interrupt(), carry on with resume(), close an abandoned stream with aclosing, and interrupt safely from another thread."
---

A UI needs two things from a running agent: a way to stop it without losing what it did, and a way to carry on later. Hold a session with `agent.start()`; `interrupt()` and `resume()` live on the session.

## Stop a run and resume it

`session.interrupt()` asks the current run to stop at its next step, streamed chunk or retry wait. The run doesn't raise: it ends with a `FinalEvent` whose status is `"interrupted"`, and `run()` returns `"Run interrupted."`. Memory keeps everything up to that point, so `session.resume()` carries on without adding a new user turn:

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
async def slow_search(query: str) -> str:
    """Search the archive.

    Args:
        query: What to search for.
    """
    await asyncio.sleep(0.2)
    return f"3 results for {query}"


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("c1", "slow_search", {"query": "agents"})]),
        ChatMessage("assistant", "Found 3 results about agents."),
    ]
)


async def main() -> None:
    session = Agent(model=model, tools=[slow_search]).start()
    job = asyncio.create_task(session.run("Search the archive for agents."))

    await asyncio.sleep(0.05)  # the user presses Stop while the tool runs
    session.interrupt()

    print(await job)
    print("running:", session.is_running)
    print(await session.resume())


asyncio.run(main())
```

```text
Run interrupted.
running: False
Found 3 results about agents.
```

The tool call that was already running finished and was recorded, so `resume()` sent its result to the model and got the answer. A tool is never stopped halfway; the interrupt takes effect between steps.

Two rules keep this predictable:

- **An interrupt with no run active does nothing.** A stray click between runs never stops the next one, because every run clears the flag when its first step begins. That moment is the first iteration, not the `run()` call: a Stop sent between `asyncio.create_task(session.run(...))` and the task's first step is cleared and lost. Track a pending state in your UI from the moment you start the task, or `await asyncio.sleep(0)` after `create_task` so the run has begun before you enable Stop.
- **`resume()` needs something to resume.** It raises `ValueError("Nothing to resume")` when memory is empty or already ends with an answer, so disable the Resume button when the last run completed.

## Show running state

`session.is_running` is `True` from the moment the run's first step begins until its last event, not from the `run()` call. Right after `create_task`, it is still `False`, so a second Send in that gap gets past a check on `is_running`; guard with your own pending flag too. A session runs one task at a time: calling `run()` or `resume()` while it's running raises `RuntimeError`. Use it to enable and disable controls, and give each conversation its own session.

## Close a stream you stop reading

A UI that renders `run(task, stream=True)` might stop reading early, for example when the user navigates away. The session counts as running until the stream is closed, and an abandoned stream is only closed when Python collects it. Close it yourself with `contextlib.aclosing`:

```python
import asyncio
from contextlib import aclosing

from agentling import Agent, ChatMessage, TextDelta
from agentling.testing import ScriptedModel

model = ScriptedModel([ChatMessage("assistant", "A long answer.")])
session = Agent(model=model).start()


async def main() -> None:
    async with aclosing(session.run("Explain it all.", stream=True)) as events:
        async for event in events:
            if isinstance(event, TextDelta):
                print("first text:", event.text)
                break  # the user left the page
    print("running:", session.is_running)


asyncio.run(main())
```

```text
first text: A long answer.
running: False
```

Use `interrupt()` when the user means "stop and keep what you have". Use `aclosing` when nobody is reading the stream any more. An exception that escapes the loop body needs the same treatment, which `aclosing` gives you.

## Interrupt from another thread

`interrupt()` is meant to be called on the event loop running the agent, for example from another task handling a button click. A desktop UI or a signal handler often runs on another thread; schedule the call onto the agent's loop with `loop.call_soon_threadsafe`:

```python
import asyncio
import threading

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
async def wait() -> str:
    """Wait a moment."""
    await asyncio.sleep(0.2)
    return "done"


model = ScriptedModel([ChatMessage("assistant", tool_calls=[ToolCall("c1", "wait", {})])])
session = Agent(model=model, tools=[wait]).start()


async def main() -> None:
    loop = asyncio.get_running_loop()

    def stop_button() -> None:  # runs on the UI thread
        loop.call_soon_threadsafe(session.interrupt)

    threading.Timer(0.05, stop_button).start()
    print(await session.run("Wait, then answer."))


asyncio.run(main())
```

```text
Run interrupted.
```

For the full list of session methods, see [Agent and AgentSession](/docs/reference/agent-and-session). To keep a conversation across restarts, see [Persist sessions](/docs/how-to/persist-sessions).
