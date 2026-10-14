---
title: Streaming Events
slug: streaming-events
description: A small set of typed events reports everything the loop does.
order: 4
metaTitle: "Streaming events: typed events from every run"
metaDescription: "The small set of typed events the loop emits while it runs: text deltas, tool calls, tool results, and the final event, and how to consume them."
---

The loop communicates progress through a small set of frozen event types. Pass `stream=True` to `run()` and you get an async iterator of these events; leave it off and the same generator is drained for you. One code path serves both modes.

## The event types

| Event | Meaning |
| --- | --- |
| `TextDelta` | A chunk of streamed assistant text. |
| `ToolCallEvent` | Emitted just before a tool call runs. |
| `ToolResultEvent` | Emitted after a tool call completes, success or error. |
| `StepEvent` | Emitted after a step is recorded to memory; carries the step. |
| `FinalEvent` | Emitted once when the run ends; carries the answer and usage. |

`StepEvent` is the bridge between the live event stream and the durable memory: it carries the exact `ActionStep` that was just written. If you persist steps as they arrive, your store always matches the session's [Memory](/docs/core-concepts/memory).

The `FinalEvent` also reports cumulative token usage for the whole run and a terminal status: `completed`, `interrupted`, or `max_steps`.

## Consuming the stream

```python
from agentling import FinalEvent, TextDelta, ToolCallEvent

async for event in agent.run("Summarize this.", stream=True):
    if isinstance(event, TextDelta):
        print(event.text, end="", flush=True)
    elif isinstance(event, ToolCallEvent):
        print(f"\n[calling {event.tool_call.name}]")
    elif isinstance(event, FinalEvent):
        print(f"\nDone: {event.answer}")
```

There is a ready-made renderer, `print_events`, that consumes the stream, prints text as it arrives along with each tool call and result, and returns the final answer. It is the "streaming CLI" in about thirty lines, and a reference consumer you can copy to drive a UI, log to a database, or compute metrics.

```python
answer = await print_events(agent.run("What is 19 + 23?", stream=True))
```

## How streaming and tool calls coexist

`Model.stream` yields `Delta` objects: small chunks of content or fragments of a tool call. Tool-call arguments in particular arrive in pieces across many deltas. The module-level `agglomerate_deltas` function reassembles a delta stream back into a single `ChatMessage`: it concatenates content, merges tool-call fragments by their index, and captures the final usage.

This is why the loop can stream text to the user and still work with a complete `ChatMessage` for tool execution: it streams and reassembles at the same time. For the full picture of where events fire inside a step, see [The Agent Loop](/docs/core-concepts/agent-loop), and for the complete field listing see the [Events reference](/docs/reference/events).
