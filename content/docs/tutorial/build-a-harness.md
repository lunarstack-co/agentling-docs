---
title: Build a harness
slug: build-a-harness
description: Put approvals, saving, rendering and error handling around the engine, in your own code.
order: 7
metaTitle: "Build a harness around the Agentling loop"
metaDescription: "Wrap the Agentling engine in a harness of your own: approve risky tool calls, save every conversation as it runs, show events, and recover from outages."
---

By the end of this chapter you'll have a small harness: a host that runs many conversations on one agent, asks a person before a risky tool runs, saves every conversation as it goes, and tells the user when the model is down instead of crashing.

**You need:** the programs from the earlier chapters, especially [Keep memory and resume](/docs/tutorial/memory-and-resume) and [Test your agent](/docs/tutorial/test-your-agent).

The harness is everything you build around the engine. Agentling runs the loop; what happens before a tool runs, where conversations live and what the user sees are decisions for your app. Each step below adds one of them, using only the hooks you've already met: tools, sessions, step callbacks, events and `resume()`.

## 1. Ask before a risky tool runs

An approval is a tool that wraps another tool. Subclass `Tool`, copy the inner tool's name, description and schema, and decide in `forward` whether to run it. When the person says no, return a message saying so: the model reads it as the tool's result and can ask what to do instead. Setting `parallel_safe = False` makes any step that calls it run its tools one at a time, so approvals never pile up at once.

```python
import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

from agentling import Agent, ChatMessage, Tool, ToolCall, tool
from agentling.testing import ScriptedModel

Approve = Callable[[str, dict[str, Any]], Awaitable[bool]]


class NeedsApproval(Tool):
    """Wraps a tool so a person approves each call before it runs."""

    parallel_safe = False

    def __init__(self, inner: Tool, approve: Approve) -> None:
        self.inner = inner
        self.approve = approve
        self.name = inner.name
        self.description = inner.description
        self.parameters = inner.parameters

    async def forward(self, **arguments: Any) -> Any:
        if not await self.approve(self.name, arguments):
            return "The user declined this call. Ask them what they want instead."
        return await self.inner.forward(**arguments)


@tool
def delete_notes() -> str:
    """Delete all of the user's notes."""
    return "All notes deleted."


async def say_no(name: str, arguments: dict[str, Any]) -> bool:
    print(f"allow {name}({arguments})? no")
    return False


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("c1", "delete_notes", {})]),
        ChatMessage("assistant", "I didn't delete anything. What would you like to do?"),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[NeedsApproval(delete_notes, say_no)])
    print(await agent.run("Clear out my notes."))
    print("model saw:", model.calls[1][-1].content)


asyncio.run(main())
```

```text
allow delete_notes({})? no
I didn't delete anything. What would you like to do?
model saw: The user declined this call. Ask them what they want instead.
```

Here `say_no` stands in for the person. The hook is async so that waiting for an answer never blocks the loop that every other conversation shares: in a terminal it would run `input()` in a thread with `await asyncio.to_thread(input, prompt)`, and in a web app it would await a future that the browser's click resolves.

## 2. Save conversations as they run

Keep one session per conversation and save its memory where your app keeps data. A step callback saves after every tool-calling step, so a crash mid-run loses at most the step in progress. Step callbacks run only for steps with tool calls, and the final answer is not one, so save once more when the run ends.

```python
import asyncio

from agentling import Agent, AgentSession, ChatMessage, Memory, Step, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


store: dict[str, str] = {}


def open_session(agent: Agent, conversation: str) -> AgentSession:
    session = agent.start()
    if conversation in store:
        session.memory = Memory.load_json(store[conversation])

    def save(step: Step) -> None:
        store[conversation] = session.memory.dump_json()

    session.step_callbacks.append(save)
    return session


async def ask(session: AgentSession, conversation: str, text: str) -> str:
    answer = await session.run(text, reset=False)
    store[conversation] = session.memory.dump_json()
    return answer


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("c1", "add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
        ChatMessage("assistant", "You asked me to add 19 and 23."),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[add])

    session = open_session(agent, "alice")
    await ask(session, "alice", "What is 19 + 23?")
    print("saved steps:", len(Memory.load_json(store["alice"]).steps))

    reopened = open_session(agent, "alice")
    print(await ask(reopened, "alice", "What did I ask you?"))


asyncio.run(main())
```

```text
saved steps: 3
You asked me to add 19 and 23.
```

The dictionary stands in for a database or a directory of files. Because the saved memory is plain JSON, any process can reopen the conversation.

## 3. Survive a model outage

When the model fails for good (retries used up, or not retryable), `run` raises a `ModelError` and the memory keeps everything up to that point. Catch it, tell the user, and call `resume()` when they try again: the run continues without repeating their question.

```python
import asyncio

from agentling import Agent, ChatMessage, ModelError, ModelServerError
from agentling.testing import ScriptedModel

model = ScriptedModel(
    [ModelServerError("overloaded"), ChatMessage("assistant", "Here's your answer.")]
)


async def main() -> None:
    session = Agent(model=model, retry=None).start()
    try:
        await session.run("Summarise my notes.")
    except ModelError as error:
        print(f"The model is unavailable ({error}). Try again in a moment.")

    print([type(step).__name__ for step in session.memory.steps])
    print(await session.resume())


asyncio.run(main())
```

```text
The model is unavailable (overloaded). Try again in a moment.
['TaskStep']
Here's your answer.
```

`retry=None` turns off the loop's own retries so the failure shows at once; a real harness would usually keep them.

## The complete program

A `Harness` class that combines the three steps with the event rendering from earlier chapters. It starts from two tools, `add` and a new `save_note`, rather than every tool and the skill from earlier chapters, so the harness code stays in view; your own tools go in the same list. One agent serves every conversation; each conversation gets a session that is saved as it runs, a risky tool asks first, and a model outage becomes a message the user can act on. To stop a run from your UI, call `interrupt()` on the conversation's session, as in [Interrupt and resume from a UI](/docs/how-to/interrupt-from-a-ui).

```python title="harness.py"
import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

from agentling import (
    Agent,
    AgentSession,
    ChatMessage,
    Event,
    FinalEvent,
    Memory,
    ModelError,
    ModelServerError,
    Step,
    TextDelta,
    Tool,
    ToolCall,
    ToolCallEvent,
    ToolResultEvent,
    tool,
)
from agentling.testing import ScriptedModel

Approve = Callable[[str, dict[str, Any]], Awaitable[bool]]


class NeedsApproval(Tool):
    """Wraps a tool so a person approves each call before it runs."""

    parallel_safe = False

    def __init__(self, inner: Tool, approve: Approve) -> None:
        self.inner = inner
        self.approve = approve
        self.name = inner.name
        self.description = inner.description
        self.parameters = inner.parameters

    async def forward(self, **arguments: Any) -> Any:
        if not await self.approve(self.name, arguments):
            return "The user declined this call. Ask them what they want instead."
        return await self.inner.forward(**arguments)


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


NOTES: list[str] = []


@tool
def save_note(text: str) -> str:
    """Save a note for the user.

    Args:
        text: The note to save.
    """
    NOTES.append(text)
    return f"Saved note {len(NOTES)}."


class Harness:
    """Hosts one agent and many conversations: approvals, saving, rendering."""

    def __init__(self, model, approve: Approve) -> None:
        self.agent = Agent(
            model=model,
            tools=[add, NeedsApproval(save_note, approve)],
            retry=None,
        )
        self.store: dict[str, str] = {}
        self.sessions: dict[str, AgentSession] = {}

    def session(self, conversation: str) -> AgentSession:
        if conversation not in self.sessions:
            session = self.agent.start()
            if conversation in self.store:
                session.memory = Memory.load_json(self.store[conversation])

            def save(step: Step) -> None:
                self.store[conversation] = session.memory.dump_json()

            session.step_callbacks.append(save)
            self.sessions[conversation] = session
        return self.sessions[conversation]

    async def ask(self, conversation: str, text: str) -> None:
        print(f"[{conversation}] > {text}")
        session = self.session(conversation)
        await self._show(session.run(text, stream=True, reset=False), conversation)

    async def try_again(self, conversation: str) -> None:
        print(f"[{conversation}] (retrying)")
        await self._show(self.session(conversation).resume(stream=True), conversation)

    async def _show(self, events, conversation: str) -> None:
        session = self.sessions[conversation]
        render = Renderer()
        try:
            async for event in events:
                render(event)
        except ModelError as error:
            render.end_line()
            print(f"  ! the model is unavailable ({error}); your conversation is saved")
        self.store[conversation] = session.memory.dump_json()


class Renderer:
    """Prints events as they arrive, keeping streamed text on one line."""

    def __init__(self) -> None:
        self.mid_line = False

    def end_line(self) -> None:
        if self.mid_line:
            print()
            self.mid_line = False

    def __call__(self, event: Event) -> None:
        if isinstance(event, TextDelta):
            print(event.text if self.mid_line else f"  {event.text}", end="", flush=True)
            self.mid_line = True
            return
        self.end_line()
        match event:
            case ToolCallEvent(tool_call=call):
                print(f"  -> {call.name}({call.arguments})")
            case ToolResultEvent(result=result):
                print(f"  <- {result.content}")
            case FinalEvent():
                pass


async def approve_in_terminal(name: str, arguments: dict[str, Any]) -> bool:
    answer = "yes"  # a real harness: await asyncio.to_thread(input, f"Allow {name}? ")
    print(f"  ? allow {name}({arguments}): {answer}")
    return answer == "yes"


def build_model() -> ScriptedModel:
    return ScriptedModel(
        [
            ChatMessage("assistant", tool_calls=[ToolCall("c1", "add", {"a": 19, "b": 23})]),
            ChatMessage(
                "assistant", tool_calls=[ToolCall("c2", "save_note", {"text": "19 + 23 = 42"})]
            ),
            ChatMessage("assistant", "Saved: 19 + 23 = 42."),
            ModelServerError("overloaded"),
            ChatMessage("assistant", "You have one note: 19 + 23 = 42."),
        ]
    )


async def main() -> None:
    harness = Harness(build_model(), approve=approve_in_terminal)
    await harness.ask("alice", "Add 19 and 23 and save it as a note.")
    await harness.ask("alice", "What notes do I have?")
    await harness.try_again("alice")
    print(f"notes: {NOTES}")
    print(f"saved conversations: {list(harness.store)}")


if __name__ == "__main__":
    asyncio.run(main())
```

It prints:

```text
[alice] > Add 19 and 23 and save it as a note.
  -> add({'a': 19, 'b': 23})
  <- 42
  -> save_note({'text': '19 + 23 = 42'})
  ? allow save_note({'text': '19 + 23 = 42'}): yes
  <- Saved note 1.
  Saved: 19 + 23 = 42.
[alice] > What notes do I have?
  ! the model is unavailable (overloaded); your conversation is saved
[alice] (retrying)
  You have one note: 19 + 23 = 42.
notes: ['19 + 23 = 42']
saved conversations: ['alice']
```

To use a real model, pass your adapter to `Harness` in place of `build_model()`, as in [Connect a real model](/docs/tutorial/connect-a-model). Nothing else changes.

## What you built

A harness: the host process, approvals, storage and user-facing errors around an engine you didn't have to write. That's the whole tutorial. From here, the how-to guides cover single tasks such as [writing your own adapter](/docs/how-to/write-a-model-adapter) or [running a local model](/docs/how-to/run-a-local-model), the [concepts](/docs/concepts/the-agent-loop) explain why the loop works as it does, and the [reference](/docs/reference/agent-and-session) lists every class and setting. [Aldwin](https://github.com/lunarstack-co/aldwin) is a larger harness built the same way.
