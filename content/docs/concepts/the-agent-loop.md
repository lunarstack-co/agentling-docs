---
title: The agent loop
slug: the-agent-loop
description: What happens on every step of a run, and the rules the loop follows when something goes wrong.
order: 1
metaTitle: "The agent loop: how a run works"
metaDescription: "How Agentling runs a task: one model turn per step, tools run between turns, every step recorded and streamed, and the rules for errors, retries and stops."
---

An agent is a loop: send the conversation to a model, run the tools it asks for, add the results to the conversation, and repeat until the model answers. Agentling is that loop. Everything else in the package is a type the loop reads or writes.

<figure class="not-prose my-8">
<svg role="img" aria-label="Your harness sits on top of the Agentling loop. The loop runs model turns and tool calls, records memory and streams events. Your model adapter and your tools sit underneath it." viewBox="0 0 720 360" width="100%" xmlns="http://www.w3.org/2000/svg" style="font-family: var(--font-sans); max-width: 720px">
<rect x="1" y="1" width="718" height="88" rx="10" style="fill: var(--bg-raised); stroke: var(--border-default)"/>
<text x="24" y="34" style="fill: var(--fg); font-size: 16px; font-weight: 600">Your harness</text>
<text x="24" y="62" style="fill: var(--fg-secondary); font-size: 14px">the process that hosts it, approvals, the UI, your server</text>
<line x1="360" y1="90" x2="360" y2="128" style="stroke: var(--border-default); stroke-width: 1.5"/>
<rect x="1" y="128" width="718" height="104" rx="10" style="fill: var(--accent-subtle); stroke: var(--accent)"/>
<text x="24" y="160" style="fill: var(--fg); font-size: 16px; font-weight: 600">Agentling: the loop</text>
<text x="24" y="190" style="fill: var(--fg-secondary); font-size: 14px">model turn, then tool calls, repeated until the model answers</text>
<text x="24" y="214" style="fill: var(--fg-secondary); font-size: 14px">typed memory you can save, events you can stream, retries and interrupts</text>
<line x1="180" y1="232" x2="180" y2="270" style="stroke: var(--border-default); stroke-width: 1.5"/>
<line x1="540" y1="232" x2="540" y2="270" style="stroke: var(--border-default); stroke-width: 1.5"/>
<rect x="1" y="270" width="350" height="88" rx="10" style="fill: var(--bg-raised); stroke: var(--border-default)"/>
<text x="24" y="304" style="fill: var(--fg); font-size: 16px; font-weight: 600">Your model adapter</text>
<text x="24" y="332" style="fill: var(--fg-secondary); font-size: 14px">any object with a stream() method</text>
<rect x="369" y="270" width="350" height="88" rx="10" style="fill: var(--bg-raised); stroke: var(--border-default)"/>
<text x="392" y="304" style="fill: var(--fg); font-size: 16px; font-weight: 600">Your tools</text>
<text x="392" y="332" style="fill: var(--fg-secondary); font-size: 14px">plain Python functions</text>
</svg>
</figure>

Your harness is the code around the loop: the process that hosts it, approvals, the UI. It calls `run()` and reads what comes back. Underneath, the loop calls your model adapter for each turn and your tools for each call. Neither side knows about the other.

## One step at a time

Each pass through the loop is a step. A step streams one model turn, runs whatever tools the model asked for, records the outcome, and checks whether the run is done:

```text
  run(task, stream=True)                run(task)
          │                                 │
          ▼                                 ▼
     _run_stream(task)  ◀──────────  _drain(_run_stream(task))
          │
          │  one iteration is one step
          ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ 1. interrupt requested?  -> yield FinalEvent, stop (resumable)   │
  │ 2. Memory.to_messages(instructions), then context_manager        │
  │ 3. Model.stream(messages, tools)  -> Deltas                      │
  │       - each text chunk is yielded as a TextDelta                │
  │       - agglomerate_deltas() rebuilds one ChatMessage            │
  │ 4. no tool calls?  -> that text is the answer; finish            │
  │ 5. yield a ToolCallEvent per call (none for final_answer)        │
  │ 6. run the tools, concurrently by default  -> ToolResults        │
  │       - an exception becomes an error result                     │
  │       - an exact repeat of the last step's calls gets a nudge    │
  │ 7. yield a ToolResultEvent per result (none for final_answer);   │
  │    record an ActionStep, run step_callbacks, yield StepEvent     │
  │ 8. final_answer called?  -> finish with a FinalEvent             │
  └──────────────────────────────────────────────────────────────────┘
          │
          ▼
  step limit reached  -> ask once for a tool-free answer, then finish
```

The loop is one async generator, `AgentSession._loop`, in [`agent.py`](https://github.com/lunarstack-co/agentling/blob/v0.2.0/src/agentling/agent.py). `run(stream=True)` hands you `_run_stream`, a thin wrapper around it that lets a session run one task at a time; `run()` drains the same wrapper and returns the answer. Both modes run the same code, so what you see streamed is exactly what a blocking run did.

A run finishes in one of three ways: the model replies with text and no tool calls, the model calls the built-in `final_answer` tool, or the step limit is reached and the loop asks once more with no tools offered. It can also stop early: `interrupt()` ends it with a `"Run interrupted."` answer it can resume from, and an error it can't recover from is raised to the caller.

## What a run yields

This run calls a tool once, then answers. Printing each event's type shows the order the loop guarantees:

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


model = ScriptedModel(
    [
        ChatMessage("assistant", "Adding. ", tool_calls=[ToolCall("c1", "add", {"a": 2, "b": 3})]),
        ChatMessage("assistant", "2 + 3 = 5."),
    ]
)


async def main() -> None:
    async for event in Agent(model=model, tools=[add]).run("What is 2 + 3?", stream=True):
        print(type(event).__name__)


asyncio.run(main())
```

```text
TextDelta
ToolCallEvent
ToolResultEvent
StepEvent
TextDelta
FinalEvent
```

Within a step the order is fixed: text chunks, every `ToolCallEvent`, every `ToolResultEvent` in the same order, then the `StepEvent` carrying the recorded step. A run that ends normally yields exactly one `FinalEvent`, last. A run that fails raises instead of yielding one.

## Memory is the conversation

The loop doesn't keep a list of raw messages. It records typed steps: a `TaskStep` for each user turn, an `ActionStep` for each model turn with tool calls (the model's message, the tool results, usage and duration), and a `FinalStep` for the answer. Before every model call it renders the steps back into messages, with the system prompt first. The system prompt is configuration, not history, so it's never stored.

That split is what makes a run something you can save, reload and continue: memory is the record, and events are the live view of it.

## When things go wrong

The loop has a rule for each way a step can fail. None of them is hidden; each is visible in the events or in memory.

**A tool raises.** The exception becomes an error result the model sees, with a hint: "Fix the arguments and try again" for bad arguments, "Consider a different approach or tool" for anything else. The run carries on. A timeout and an unknown tool name are handled the same way.

**The model repeats itself.** If a step's tool calls exactly repeat the previous step's, same names and arguments, each result gets a note saying so, which is usually enough to break the cycle.

**The model's tool call can't be parsed.** The loop tells the model what was wrong and asks again, up to twice in a row, then raises `ModelError`. These corrections don't count towards `max_steps`. If the turn stopped because it hit the model's output limit, asking again can't help, so the loop raises `ModelOutputTruncatedError` at once.

**The model call fails.** A turn that raised a retryable `ModelError` before its first chunk is retried under the agent's `RetryPolicy`, with backoff. Once text has streamed, a retry would show it twice, so the error is raised instead. Tools only run after a turn completes, so a retry never runs a tool twice.

**The caller stops it.** `interrupt()` sets a flag the loop checks at the top of each step, after each streamed chunk, during a retry wait and before the step-limit answer. The run yields a `FinalEvent` with status `"interrupted"` and writes no answer, so `resume()` picks up from memory.

## Tools run concurrently

When one model turn asks for several tool calls, they run together with `asyncio.gather`. If any of them is marked `parallel_safe=False`, or the agent has `parallel_tools=False`, the step runs them in order instead. Sync functions run in a worker thread either way, so a blocking call can't stall the stream.

## What it doesn't do

The loop runs one agent's conversation. It doesn't trace to a backend (the events and step callbacks are the hooks), sandbox tools (they're your code), summarise context (pass a `context_manager`), or orchestrate several agents (run several sessions). Those belong to your harness.

[The model contract](/docs/concepts/the-model-contract) covers what the loop expects from a model, and [Design decisions](/docs/concepts/design-decisions) covers why it works this way.
