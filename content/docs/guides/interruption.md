---
title: Interruption
slug: interruption
description: Stop a running agent gracefully with session.interrupt() and resume it exactly where it paused.
order: 3
---

Sometimes you need to stop an agent mid-run: a user hits a stop button, a deadline passes, or your process receives a shutdown signal. agentling supports graceful interruption that preserves the run so you can resume it later.

## Requesting a stop

Call `session.interrupt()` from anywhere: a signal handler, another task, or a UI button.

```python
session = agent.start()
session.interrupt()            # from a signal handler, another task, a UI button
await session.run(task)        # returns "Run interrupted." at the next boundary
```

The current run does not crash. `interrupt()` sets an event that the loop checks at the top of each step, so the run finishes whatever step it is in and stops at the next step boundary.

## What happens under the hood

When the loop sees the interrupt flag, it emits a final "Run interrupted." event and returns without writing a terminal `FinalStep`. Two things follow from that design:

- **Memory is preserved.** Every step completed before the interrupt is still in `session.memory`.
- **The run is resumable.** Because no terminal step was written, the memory looks like a run in progress, and `run(..., reset=False)` picks it back up exactly where it paused.

```python
# ... later ...
await session.run(task, reset=False)   # picks up where it left off
```

See [The agent loop](/docs/core-concepts/agent-loop) for where the interrupt check sits in each iteration, and [Persistence and Resuming](/docs/guides/persistence-and-resuming) for continuing a run across process restarts.

## Wiring it to Ctrl+C

A common pattern is to translate SIGINT into a graceful stop instead of a stack trace:

```python
import asyncio
import signal

from agentling import Agent, OpenAIModel

agent = Agent(model=OpenAIModel("gpt-4o-mini"), tools=[search])


async def main() -> None:
    session = agent.start()
    loop = asyncio.get_running_loop()
    loop.add_signal_handler(signal.SIGINT, session.interrupt)

    answer = await session.run("Research this topic thoroughly.")
    print(answer)


asyncio.run(main())
```

Press Ctrl+C and the run winds down at the next step boundary with its memory intact.

## When to interrupt vs. cancel

Cancelling the task with `asyncio` tears the run down immediately and gives no guarantees about memory. `interrupt()` trades a little latency (the current step completes) for a clean, resumable state. Prefer `interrupt()` whenever you might want the work back.

## Related pages

- [Sessions and Concurrency](/docs/guides/sessions-and-concurrency): sessions hold the interrupt token.
- [Streaming events](/docs/core-concepts/streaming-events): observe the final event an interrupted run emits.
