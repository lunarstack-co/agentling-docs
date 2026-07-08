---
title: "One loop, two modes: how agentling streams"
slug: one-loop-two-modes
excerpt: Blocking and streaming agents usually mean two code paths and subtle drift between them. agentling has exactly one loop, and blocking mode just drains it.
publishDate: 2026-07-08T09:00:00Z
authorName: Folarin Akinloye
tags:
  - engineering
  - internals
featured: false
readingMinutes: 6
---

Every agent framework eventually faces the same question: do you return the final answer, or do you stream events as they happen? Most answer "both", and then quietly maintain two implementations that drift apart. agentling answers "both" with a single async generator, and I want to show you how that works.

## The whole framework hangs off one generator

Inside every agentling session there is one method that matters: `_run_stream`. It is an async generator, and one iteration of it is one step of the ReAct loop. Stream a model turn, run the tool calls the model asked for, record the outcome, check whether the run is done.

`run()` is a thin dispatcher on top of it:

```python
# streaming mode: hand the generator to the caller
events = agent.run(task, stream=True)

# blocking mode: drain the same generator internally
answer = await agent.run(task)
```

In streaming mode you get the generator itself, wrapped as an async iterator of typed events. In blocking mode the framework consumes that same generator to exhaustion and hands you the final answer string. There is no second implementation to keep in sync, so a bug fixed in one mode is fixed in both, and behavior can never diverge between them.

## Streaming and reassembling at the same time

The tricky part of streaming an agent is that the model's output arrives in fragments, but tool execution needs complete calls. Tool-call arguments in particular arrive in pieces across many deltas.

agentling solves this with a small function called `agglomerate_deltas`. The model adapter yields `Delta` objects: small chunks of text or fragments of a tool call. The loop forwards each text chunk to you immediately as a `TextDelta` event, and at the same time it accumulates every delta. When the turn ends, `agglomerate_deltas` has rebuilt one complete `ChatMessage`: content concatenated, tool-call fragments merged by index, final usage captured.

This is why the loop can stream text to your terminal and still hand fully-formed, validated tool calls to the executor. It streams and reassembles simultaneously, with no buffering compromise in either direction.

## Five events, one contract

The loop communicates through a small set of frozen event types:

| Event | Meaning |
| --- | --- |
| `TextDelta` | A chunk of streamed assistant text. |
| `ToolCallEvent` | Emitted just before a tool call runs. |
| `ToolResultEvent` | Emitted after a tool call completes. |
| `StepEvent` | Emitted after a step is recorded to memory. |
| `FinalEvent` | Emitted once when the run ends. |

`StepEvent` is the one I want to highlight. It carries the exact `ActionStep` that was just written to memory, which makes it the bridge between the live stream and the durable record. If you are building a UI, you render `TextDelta` and `ToolCallEvent` for liveness. If you are logging or computing metrics, you consume `StepEvent` and get the same typed steps that persistence uses. The two views can never disagree, because they are produced by the same write.

## Why this matters in practice

The single-code-path design sounds like an implementation detail, but it shows up in the developer experience constantly:

- You can prototype with blocking `run()` and switch to streaming later without changing agent behavior.
- `print_events`, the built-in CLI renderer, is just a consumer of the public event stream. Your custom UI has access to everything the built-in one does.
- Tests that assert on events also validate blocking mode, because blocking mode is those events, drained.

The full event reference is in the [docs](/docs/core-concepts/streaming-events), and the loop itself is about a page of code in `agent.py`. Reading it is the fastest way to understand the framework, which is exactly the point.
