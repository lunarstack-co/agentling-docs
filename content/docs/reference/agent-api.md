---
title: Agent API
slug: agent-api
description: Every Agent constructor parameter, the run method, and the AgentSession surface.
order: 1
---

`Agent` is immutable configuration: a model, some tools, and settings. Build one once, share it freely, and let sessions carry the per-run state. This page lists every knob on the constructor and the semantics of `run()` and `start()`.

## Agent(...)

```python
from agentling import Agent, OpenAIModel

agent = Agent(
    model=OpenAIModel("gpt-4o-mini"),
    tools=[search, read_file],
    skills=["skills/code-reviewer"],
    max_steps=15,
)
```

| Parameter | Default | Description |
| --- | --- | --- |
| `model` | required | Any object implementing the `Model` protocol. |
| `tools` | `()` | Tools to register. A `final_answer` tool is always added. |
| `skills` | `()` | Skills as folder paths or `Skill` objects. |
| `instructions` | built-in default | The system prompt. A skill catalog is appended when skills are present. |
| `max_steps` | `15` | Maximum loop iterations before a forced answer. Must be at least 1. |
| `step_callbacks` | `()` | Callables invoked with each `ActionStep` as it is recorded. |
| `parallel_tools` | `True` | Run a turn's tool calls concurrently, or in order when `False`. |
| `tool_timeout` | `None` | Per-call time budget in seconds for tools. A timeout becomes a recoverable observation. |
| `model_timeout` | `None` | Time budget in seconds for each model turn. Exceeding it raises `ModelError`. |
| `max_tool_output_chars` | `None` | Truncate tool observations head and tail beyond this length. |
| `redact_errors` | `False` | Hide unexpected tool-exception messages from the model and log them instead. |
| `context_manager` | `None` | Callable `messages -> messages` applied before each model call, to trim or summarize. |

## agent.run()

```python
answer = await agent.run("Summarize this file.")

async for event in agent.run("Summarize this file.", stream=True):
    ...
```

`run(task, *, stream=False, reset=True, max_steps=None)` has two modes that share one implementation:

- `stream=False` returns an awaitable that resolves to the final answer string.
- `stream=True` returns an async iterator of `Event` objects. See [Events](/docs/reference/events).
- `reset=False` continues from existing memory instead of starting fresh. See [Persistence and resuming](/docs/guides/persistence-and-resuming).
- `max_steps` overrides the agent's limit for this run only.

Calling `agent.run(task)` directly is a one-shot convenience: it spins up a fresh session, runs it, and returns the answer. Concurrent calls on one shared agent never touch each other's memory or tools.

## agent.start() and AgentSession

When you need multi-turn conversation, inspection, or interruption, hold a session:

```python
session = agent.start()
answer = await session.run("First question")
await session.run("A follow-up", reset=False)

print(session.memory.steps)   # typed steps recorded so far
session.interrupt()           # request a graceful stop
```

The session owns the per-run state: the `Memory` of typed steps, the interrupt token, and its own tool set, including any skill tools loaded during a run. See [Sessions and concurrency](/docs/guides/sessions-and-concurrency) and [Interruption](/docs/guides/interruption) for the patterns built on top of it.

## session.add_tools() and session.remove_tools()

```python
session.add_tools([create_issue, search_issues])
session.add_tools([updated_search_issues], replace=True)
session.remove_tools(["create_issue"])
```

These change one session's tools. The agent and other sessions are not affected. The model sees the change from its next call, which can be the next step of a run that is already going.

`add_tools(tools, *, replace=False)`

- Checks every tool first and adds nothing if any check fails.
- Raises `ValueError` when a name is invalid, a schema isn't an object, a name appears twice in `tools`, or a name is already in the session and `replace` is `False`.
- With `replace=True`, a tool with an existing name takes the old one's place, keeping its position in the list the model sees.

`remove_tools(names)`

- Removes the named tools. A name given twice is removed once.
- Raises `ValueError("Unknown tool: '<name>'")` and removes nothing if any name isn't in the session.
- If the model later calls a removed tool, it gets an unknown-tool observation and can carry on.

Both refuse the built-in tools: `final_answer`, and `load_skill` when the agent has skills. Change tools through these methods rather than editing `session.tools` directly.
