---
title: Memory
slug: memory
description: A run is a list of typed steps that serialize, replay, and resume.
order: 3
---

A run is recorded as a list of typed steps rather than a flat list of messages. Steps know how to render themselves back into model messages and how to serialize to JSON, which gives you persistence, replay, and multi-turn continuation without extra machinery.

## Typed steps

| Step | Meaning |
| --- | --- |
| `TaskStep` | The user's task, or a continued turn. |
| `ActionStep` | One loop iteration: the assistant message, the tool results from it, and metadata such as token usage and wall-clock duration. |
| `FinalStep` | The terminal answer. |

Each step knows how to render itself into the `ChatMessage` list the model sees, via `to_messages()`.

## Rendering the prompt

`Memory.to_messages(system_prompt)` prepends the system prompt and then renders every step in order. The system prompt is runtime configuration, not history, so it is never stored in a step. That separation is what makes the memory serializable: what you persist is exactly what happened, and the instructions can change between runs without corrupting the record.

## Persistence and replay

`dump_json` and `load_json` round-trip the whole run. Each step is tagged with its kind so it can be rebuilt exactly.

```python
session = agent.start()
await session.run("First question")

saved = session.memory.dump_json()

# ... later, in another process ...
from agentling import Memory

restored = agent.start()
restored.memory = Memory.load_json(saved)
await restored.run("A follow-up", reset=False)
```

Loading validates the payload as it rebuilds the steps. A malformed or incompatible payload raises `MemoryLoadError` rather than silently producing a broken session. See [Errors](/docs/reference/errors) for the full exception hierarchy.

## What this enables

Because the full run state lives in one serializable object, several features fall out for free:

- **Persistence.** Save a run to disk or a database between processes.
- **Replay.** Reload a run and inspect every step, including tool results and per-step usage.
- **Multi-turn continuation.** Pass `reset=False` to `run()` to continue from the session's existing memory instead of starting fresh.

```python
session = agent.start()
await session.run("First question")
await session.run("A follow-up", reset=False)   # sees the earlier turn
```

For the practical patterns, see [Persistence and resuming](/docs/guides/persistence-and-resuming) and [Interruption](/docs/guides/interruption). For how steps are produced in the first place, see [The Agent Loop](/docs/core-concepts/agent-loop).
