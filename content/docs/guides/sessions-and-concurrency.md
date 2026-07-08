---
title: Sessions and Concurrency
slug: sessions-and-concurrency
description: How Agent and AgentSession split configuration from run state, and how to run agents safely under concurrency.
order: 1
---

agentling separates what an agent is from what a run does. An `Agent` is immutable configuration, and an `AgentSession` holds the state of one conversation. Understanding that split is the key to running agents safely under concurrency.

## Agent is configuration

An `Agent` bundles the model, tools, skills, and settings. It is immutable, so you can build it once at startup and share it everywhere: across requests, tasks, and threads.

```python
from agentling import Agent, OpenAIModel

agent = Agent(model=OpenAIModel("gpt-4o-mini"), tools=[search, add])
```

The per-run state, which includes the memory, the interrupt token, and any skill tools loaded during a run, lives on an `AgentSession` instead.

## One-shot runs

`agent.run(task)` is a convenience: it spins up a fresh session, runs it to completion, and returns the answer.

```python
answer = await agent.run("A single question")
```

Because each call gets its own session, concurrent calls on one shared agent never touch each other's memory or tools:

```python
import asyncio

answers = await asyncio.gather(
    agent.run("Summarize the release notes"),
    agent.run("What changed in the config?"),
)
```

## Holding a session

When you need multi-turn conversation, inspection, or [interruption](/docs/guides/interruption), hold a session with `agent.start()`:

```python
session = agent.start()
answer = await session.run("First question")

# inspect the typed steps recorded so far
print(session.memory.steps)

# continue the same conversation
follow_up = await session.run("A follow-up", reset=False)
```

The session's `memory` is a list of typed steps, not raw messages. See [Memory](/docs/core-concepts/memory) for what each step contains, and [Persistence and Resuming](/docs/guides/persistence-and-resuming) for saving it.

## Concurrency inside a step

When a single model turn requests several tool calls, the loop runs them concurrently with `asyncio.gather` by default. If your tools share state or must not interleave, run them in order instead:

```python
agent = Agent(
    model=OpenAIModel("gpt-4o-mini"),
    tools=[read_notes, write_notes],
    parallel_tools=False,
)
```

| Setting | Behavior |
| --- | --- |
| `parallel_tools=True` (default) | A turn's tool calls run concurrently. |
| `parallel_tools=False` | Tool calls run one at a time, in order. |

## Rules of thumb

- Share `Agent` objects freely; never share an `AgentSession` between concurrent runs.
- Use `agent.run()` for stateless, one-shot work.
- Use `agent.start()` when a conversation, inspection, or interruption matters.
- Disable `parallel_tools` only when tools genuinely cannot interleave.

For the full list of constructor options, see the [Agent API](/docs/reference/agent-api).
