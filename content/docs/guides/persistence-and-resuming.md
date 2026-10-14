---
title: Persistence and Resuming
slug: persistence-and-resuming
description: Serialize a session's memory to JSON, restore it later, and continue runs with reset=False.
order: 2
metaTitle: "Persist a session to JSON and resume it later"
metaDescription: "Serialize a session's memory to JSON, restore it in a new process, and continue the run with reset=False so the model picks up exactly where it stopped."
---

Every session records its run as typed memory that serializes to JSON. That gives you persistence, replay, and multi-turn continuation without any extra infrastructure.

## Saving memory

Each session keeps a `Memory` of typed steps. Dump it to a JSON string at any point:

```python
session = agent.start()
await session.run("First question")

saved = session.memory.dump_json()
# write `saved` to a file, a database row, a cache, anywhere
```

Because each step knows how to serialize itself and is tagged with its kind, the whole run round-trips cleanly. See [Memory](/docs/core-concepts/memory) for the step types involved.

## Restoring memory

Later, in another process if you like, rebuild the session from the saved JSON:

```python
from agentling import Memory

restored = agent.start()
restored.memory = Memory.load_json(saved)
```

`load_json` validates what it reads. If the payload is malformed or does not match the expected step shapes, it raises `MemoryLoadError` instead of silently building a broken session. See [Errors](/docs/reference/errors) for the exception hierarchy.

## Continuing with reset=False

By default each `run()` starts fresh. Pass `reset=False` to continue from the session's existing memory:

```python
session = agent.start()
await session.run("First question")
await session.run("A follow-up", reset=False)   # sees the earlier turn
```

This is the same mechanism for every kind of continuation:

| Scenario | Pattern |
| --- | --- |
| Multi-turn conversation | Keep the session, call `run(..., reset=False)` per turn. |
| Resume after a restart | `dump_json` before shutdown, `load_json` into a new session, then `run(..., reset=False)`. |
| Resume an interrupted run | Interrupt leaves memory intact; call `run(..., reset=False)` to pick up where it paused. |

## Putting it together

A minimal persistent chat loop:

```python
import pathlib

from agentling import Agent, Memory, OpenAIModel

STATE = pathlib.Path("chat-memory.json")


async def chat(agent: Agent, user_input: str) -> str:
    session = agent.start()
    if STATE.exists():
        session.memory = Memory.load_json(STATE.read_text())
        answer = await session.run(user_input, reset=False)
    else:
        answer = await session.run(user_input)
    STATE.write_text(session.memory.dump_json())
    return answer
```

The `cli_memory_chat.py` example in the repository shows this pattern end to end, with no API key required.

## Related pages

- [Interruption](/docs/guides/interruption): pause a run and resume it later.
- [Sessions and Concurrency](/docs/guides/sessions-and-concurrency): what state lives on a session.
- [The agent loop](/docs/core-concepts/agent-loop): how steps are produced.
