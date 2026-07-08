---
title: Events
slug: events
description: Every streaming event type, what it carries, and how to consume the stream.
order: 3
---

When you call `run(task, stream=True)`, the loop communicates progress through a small set of frozen event types. This page is the reference for each one and for `print_events`, the ready-made consumer.

## Event types

| Event | Meaning |
| --- | --- |
| `TextDelta` | A chunk of streamed assistant text. Read the text from `event.text`. |
| `ToolCallEvent` | Emitted just before a tool call runs. Carries the provider-neutral `ToolCall`, so `event.tool_call.name` and its parsed arguments are available. |
| `ToolResultEvent` | Emitted after a tool call completes, whether it succeeded or errored. |
| `StepEvent` | Emitted after a step is recorded to memory. Carries the exact `ActionStep` that was just written. |
| `FinalEvent` | Emitted once when the run ends. Carries the answer and cumulative token usage. |

`StepEvent` is the bridge between the live event stream and the durable memory: the `ActionStep` it carries is the same object your `step_callbacks` receive and the same object serialized by [Memory](/docs/core-concepts/memory).

## Consuming the stream

The stream is an async iterator, and each event is a plain typed object, so `isinstance` checks are the idiomatic way to branch:

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

You can write a consumer that drives a UI, logs to a database, or computes metrics. Because blocking and streaming share the same loop, everything you observe in the stream matches exactly what a blocking `run()` would have done.

## print_events

`print_events` is the reference consumer: it takes the async iterator returned by `run(task, stream=True)`, prints text as it arrives along with each tool call and result, and returns the final answer.

```python
from agentling import Agent, OpenAIModel, print_events

agent = Agent(model=OpenAIModel("gpt-4o-mini"), tools=[add])
answer = await print_events(agent.run("What is 19 + 23?", stream=True))
```

It is the streaming CLI in about thirty lines, and a good starting point to copy when you write your own renderer.

## Related pages

- [Streaming events](/docs/core-concepts/streaming-events) explains how events relate to steps in the loop.
- [The agent loop](/docs/core-concepts/agent-loop) shows exactly when each event is yielded.
