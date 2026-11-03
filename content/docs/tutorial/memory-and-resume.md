---
title: Keep memory and resume
slug: memory-and-resume
description: Hold a conversation across runs, save it to JSON, and pick up a run that was stopped.
order: 3
metaTitle: "Keep agent memory and resume a run"
metaDescription: "Use an AgentSession for multi-turn conversations, save its typed memory as JSON and load it again, and interrupt and resume a run without losing work."
---

By the end of this chapter your agent will hold a conversation over several questions, save it to a file, load it into a fresh session, and stop and restart a run halfway through.

**You need:** the program from [Handle failures](/docs/tutorial/handle-failures).

## 1. Hold a session

`agent.run(task)` creates a session, runs it and throws it away. To keep the conversation, create the session yourself with `agent.start()`. Its `memory` records the run as typed steps rather than raw messages.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
    ]
)


async def main() -> None:
    session = Agent(model=model, tools=[add]).start()
    print(await session.run("What is 19 + 23?"))
    for step in session.memory.steps:
        print(type(step).__name__)


asyncio.run(main())
```

```text
19 + 23 = 42.
TaskStep
ActionStep
FinalStep
```

A `TaskStep` is the question, an `ActionStep` is one model turn with its tool calls and their results, and a `FinalStep` is the answer. The `Agent` itself holds no conversation, so one agent can serve many sessions at once. A session runs one task at a time; starting a second run while `session.is_running` is true raises `RuntimeError`.

## 2. Ask a follow-up

Each `run` starts with empty memory unless you pass `reset=False`. With it, the new task becomes the next user turn and the model sees everything before it.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
        ChatMessage("assistant", tool_calls=[ToolCall("call_2", "add", {"a": 42, "b": 8})]),
        ChatMessage("assistant", "42 + 8 = 50."),
    ]
)


async def main() -> None:
    session = Agent(model=model, tools=[add]).start()
    print(await session.run("What is 19 + 23?"))
    print(await session.run("Add 8 to that.", reset=False))
    print([message.role for message in model.calls[-1]])


asyncio.run(main())
```

```text
19 + 23 = 42.
42 + 8 = 50.
['system', 'user', 'assistant', 'tool', 'assistant', 'user', 'assistant', 'tool']
```

The last call carried both questions, the first answer and both tool results.

## 3. Save and load the memory

`memory.dump_json()` gives you a string you can write anywhere: a file, a database row, a cache. `Memory.load_json()` turns it back into memory you can attach to a new session, in this process or another.

```python
import asyncio
from pathlib import Path

from agentling import Agent, ChatMessage, Memory, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
        ChatMessage("assistant", "You asked what 19 + 23 is."),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[add])
    first = agent.start()
    await first.run("What is 19 + 23?")
    Path("session.json").write_text(first.memory.dump_json())

    later = agent.start()
    later.memory = Memory.load_json(Path("session.json").read_text())
    print(len(later.memory.steps), "steps loaded")
    print(await later.run("What did I ask you?", reset=False))
    Path("session.json").unlink()


asyncio.run(main())
```

```text
3 steps loaded
You asked what 19 + 23 is.
```

The JSON holds every step, including tool results and token usage, so it is a full record of the run as well as a way to continue it.

## 4. Interrupt and resume

`session.interrupt()` asks the current run to stop at the next safe point: before the next model turn, after a streamed chunk, or during a retry wait. The run ends with the answer `"Run interrupted."` and keeps its memory. `session.resume()` carries on from that memory without adding a new question. Here a slow tool gives another task time to interrupt.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
async def slow_add(a: int, b: int) -> int:
    """Add two integers, slowly.

    Args:
        a: The first number.
        b: The second number.
    """
    await asyncio.sleep(0.2)
    return a + b


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "slow_add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
    ]
)


async def main() -> None:
    session = Agent(model=model, tools=[slow_add]).start()
    job = asyncio.create_task(session.run("What is 19 + 23?"))
    await asyncio.sleep(0.05)
    session.interrupt()
    print(await job)
    print([type(step).__name__ for step in session.memory.steps])

    print(await session.resume())
    print([type(step).__name__ for step in session.memory.steps])


asyncio.run(main())
```

```text
Run interrupted.
['TaskStep', 'ActionStep']
19 + 23 = 42.
['TaskStep', 'ActionStep', 'FinalStep']
```

The tool call that was running when you interrupted finished and was saved, so `resume()` didn't run it again; it went straight to the model's next turn. An interrupt while no run is active does nothing, and that includes the moment between `create_task` and the run's first step, which is why the example waits before calling `interrupt()`. And `resume()` raises `ValueError("Nothing to resume")` when the memory already ends with an answer.

## The complete program

The program from the last chapter, now holding a session: it asks two questions, saves the conversation, loads it into a new session and asks a third. It drops the retry hook, the tool timeout and the error handling from the last chapter so the session code stays in view; they work unchanged alongside it.

```python title="memory_and_resume.py"
import asyncio
from pathlib import Path

from agentling import (
    Agent,
    ChatMessage,
    Event,
    FinalEvent,
    Memory,
    TextDelta,
    ToolCall,
    ToolCallEvent,
    ToolResultEvent,
    tool,
)
from agentling.testing import ScriptedModel

SAVED = Path("conversation.json")


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a * b


@tool
def divide(a: float, b: float) -> float:
    """Divide a by b.

    Args:
        a: The number to divide.
        b: The number to divide by.
    """
    return a / b


def build_model() -> ScriptedModel:
    return ScriptedModel(
        [
            ChatMessage("assistant", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
            ChatMessage("assistant", "19 + 23 = 42."),
            ChatMessage("assistant", tool_calls=[ToolCall("call_2", "multiply", {"a": 42, "b": 2})]),
            ChatMessage("assistant", "Doubled, that's 84."),
            ChatMessage("assistant", tool_calls=[ToolCall("call_3", "divide", {"a": 84, "b": 4})]),
            ChatMessage("assistant", "84 / 4 = 21."),
        ]
    )


def render(event: Event) -> None:
    match event:
        case TextDelta(text=text):
            print(text)
        case ToolCallEvent(tool_call=call):
            print(f"  -> {call.name}({call.arguments})")
        case ToolResultEvent(result=result):
            mark = "error" if result.is_error else "ok"
            print(f"  <- {result.name} [{mark}]: {result.content}")
        case FinalEvent():
            pass


async def ask(session, task: str) -> None:
    print(f"> {task}")
    async for event in session.run(task, stream=True, reset=False):
        render(event)


async def main() -> None:
    agent = Agent(model=build_model(), tools=[add, multiply, divide])

    session = agent.start()
    await ask(session, "What is 19 + 23?")
    await ask(session, "Double it.")
    SAVED.write_text(session.memory.dump_json())

    restored = agent.start()
    restored.memory = Memory.load_json(SAVED.read_text())
    await ask(restored, "Now divide that by 4.")
    print(f"({len(restored.memory.steps)} steps in memory)")
    SAVED.unlink()


if __name__ == "__main__":
    asyncio.run(main())
```

It prints:

```text
> What is 19 + 23?
  -> add({'a': 19, 'b': 23})
  <- add [ok]: 42
19 + 23 = 42.
> Double it.
  -> multiply({'a': 42, 'b': 2})
  <- multiply [ok]: 84
Doubled, that's 84.
> Now divide that by 4.
  -> divide({'a': 84, 'b': 4})
  <- divide [ok]: 21.0
84 / 4 = 21.
(9 steps in memory)
```

## What you built

A conversation that lasts across runs and survives a restart, plus the pattern for stopping a run and finishing it later. Next, you'll give the agent instructions it loads only when it needs them: [Add skills](/docs/tutorial/skills).
