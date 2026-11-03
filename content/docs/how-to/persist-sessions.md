---
title: Persist sessions
slug: persist-sessions
description: Save a conversation to JSON and continue it later, in this process or another.
order: 5
metaTitle: "Persist and restore Agentling sessions"
metaDescription: "Save a session's memory with dump_json, restore it with Memory.load_json in any process, and continue the conversation with reset=False or resume()."
---

A session's memory is a list of typed steps that saves to JSON. Save it after a run, load it into a new session later, and the model sees the whole conversation again.

## Save and restore

`session.memory.dump_json()` returns a string. `Memory.load_json()` turns it back into a `Memory`, which you assign to a fresh session. Then `run(..., reset=False)` adds the next user turn on top:

```python
import asyncio
import tempfile
from pathlib import Path

from agentling import Agent, ChatMessage, Memory
from agentling.testing import ScriptedModel

model = ScriptedModel(
    [
        ChatMessage("assistant", "Nice to meet you, Ada."),
        ChatMessage("assistant", "Your name is Ada."),
    ]
)
agent = Agent(model=model)
store = Path(tempfile.mkdtemp()) / "conversation-42.json"


async def main() -> None:
    first = agent.start()
    print(await first.run("Hi, I'm Ada."))
    store.write_text(first.memory.dump_json())

    # Later, perhaps in another process:
    second = agent.start()
    second.memory = Memory.load_json(store.read_text())
    print(await second.run("What's my name?", reset=False))
    print("messages sent:", len(model.calls[1]))


asyncio.run(main())
```

```text
Nice to meet you, Ada.
Your name is Ada.
messages sent: 4
```

The second call carried four messages: the system prompt, the first question, the first answer and the new question. Without `reset=False`, `run()` clears memory and starts fresh.

`dump_json()` and `load_json()` work on strings, so store them wherever you keep data: a file, a database row keyed by conversation, a cache. `memory.to_dict()` and `Memory.from_dict()` give you a plain dict instead, for stores that take JSON values.

## Continue a run that didn't finish

If a run was interrupted or failed partway, its memory ends with a step that isn't an answer. Load it as above and call `session.resume()` instead of `run()`. `resume()` carries on from memory without adding a user turn, and raises `ValueError("Nothing to resume")` if memory is empty or already ends with an answer. See [Interrupt and resume from a UI](/docs/how-to/interrupt-from-a-ui).

## What's in the file

Each step is saved with a `type` tag (`"task"`, `"action"` or `"final"`) and its fields, under a format `"version"`. An action step keeps the model's message, the tool results, token usage and duration, so a saved run is also a record you can read or replay.

Agentling 0.2 writes format 2, which adds `reasoning`, `finish_reason` and `provider_data` to messages and `cached_input_tokens` and `reasoning_tokens` to `Usage`. It still reads format 1, saved by 0.1. Agentling 0.1 can't read format 2, so don't share saves between apps on different versions.

`load_json()` raises `json.JSONDecodeError` for text that isn't JSON, and `MemoryLoadError` for an unknown version or a step it can't rebuild. Catch both where you load saves you didn't write yourself.

## Keep it saveable

Everything in memory must survive `json.dumps`. Agentling checks a model adapter's `provider_data` on every turn and raises `ModelOutputError` if it isn't JSON-serialisable, so a bad adapter fails at once instead of when you save. Tool results are stored as strings.

To save after every step rather than at the end of a run, pass a step callback; it runs before each step's event, and an async one is awaited:

```python
import asyncio

from agentling import Agent, ChatMessage, Step, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def lookup(term: str) -> str:
    """Look up a term.

    Args:
        term: The term to look up.
    """
    return f"{term}: a small agent engine"


saved: list[str] = []


async def main() -> None:
    model = ScriptedModel(
        [
            ChatMessage("assistant", tool_calls=[ToolCall("c1", "lookup", {"term": "Agentling"})]),
            ChatMessage("assistant", "Agentling is a small agent engine."),
        ]
    )
    session = Agent(model=model, tools=[lookup]).start()

    async def save(step: Step) -> None:
        saved.append(session.memory.dump_json())

    session.step_callbacks.append(save)
    print(await session.run("What is Agentling?"))
    print("saves:", len(saved))


asyncio.run(main())
```

```text
Agentling is a small agent engine.
saves: 1
```

The callback ran once, for the step with the tool call. A plain-text answer is recorded without a callback, so save once more when the run returns. The [memory reference](/docs/reference/memory) lists every step field.
