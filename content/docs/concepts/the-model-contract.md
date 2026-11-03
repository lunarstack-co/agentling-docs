---
title: The model contract
slug: the-model-contract
description: The seven rules a model adapter follows, why each exists, and how check_model tests them.
order: 2
metaTitle: "The model contract and why it exists"
metaDescription: "The seven rules every Agentling model adapter follows, what breaks in the loop when one is ignored, and the eight checks check_model runs."
---

Agentling ships no model client. A model is any object with one method:

```python
# not executed: the shape of the protocol; see src/agentling/models.py
class Model(Protocol):
    def stream(
        self,
        messages: Sequence[ChatMessage],
        tools: Sequence[ToolDefinition] = (),
    ) -> AsyncIterator[Delta]: ...
```

The method signature is the easy part. The loop also relies on how the stream behaves: when it retries, how it reassembles tool calls, what it saves. The `Model` docstring states seven rules for that, and this page explains what each one protects.

## The seven rules

**1. Yield no `Delta` until it carries something.** A useful delta has content, reasoning, a tool-call fragment, usage or a finish reason; swallow metadata-only chunks. The loop retries a turn only if it failed before its first `Delta`, because after that the caller may already have shown text, and retrying would show it twice. An empty first delta moves that line for no reason: a failure that could have been retried no longer is.

**2. Yield `usage` at least once when the backend reports it, and none when it doesn't.** The last one wins, so cumulative counts are fine. A run's total is the sum over turns, and `FinalEvent.usage` is `None` when nothing was reported, so "unknown" never reads as "zero tokens".

**3. Yield `finish_reason` exactly once, on or before the last `Delta`.** The loop uses it to tell a model that stopped because it was done from one that hit its output limit. A tool call cut off by the limit can't be fixed by asking again, so the loop raises `ModelOutputTruncatedError` instead of sending a correction. Map your backend's reasons onto `stop`, `tool_calls`, `length`, `content_filter`, `error`, or `unknown` for the rest.

**4. Raise only `ModelError` subclasses, with `retryable` set correctly, and never retry yourself.** Retrying is the loop's job, under one `RetryPolicy` the app controls. An adapter that retries on its own multiplies the attempts and hides the delay. A vendor or transport exception that escapes reaches the caller unchanged, is never retried, and forces your app to import the vendor's SDK to catch it.

**5. Never mutate the `messages` or `tools` you were given.** The loop builds the list from memory for each call and may reuse the tool list. A change you make leaks into the next turn or into what memory saves.

**6. Render the system message and tool results however the backend requires.** One backend takes the system prompt as a top-level field; another wants tool results grouped into one user message. Agentling's messages are neutral on purpose, and turning them into the wire format is the adapter's whole job.

**7. Read back only your own `provider_data` namespace, and keep it JSON-serialisable.** Some backends need data returned on the next turn, such as signed thinking blocks. Put it under one key named after your adapter (`{"anthropic": {...}}`). It's kept on tool-calling turns, which are the ones sent back, and saved with memory, so it must survive `json.dumps`. The loop checks this on every turn and raises `ModelOutputError` straight away rather than when you save.

## What the loop does for you

Some things an adapter doesn't have to handle, because the loop does:

- **Missing tool-call ids.** Some servers send none. Leave `ToolCallDelta.id` as `None` and Agentling makes one up so each result can be paired with its call.
- **Reassembly.** Fragments grouped by `index` are joined by `agglomerate_deltas`; you never build a `ChatMessage` yourself.
- **Backends that can't stream.** Wrap a whole reply with `deltas_from_message(reply)`, which yields it as one `Delta`.

## How `check_model` tests the contract

`agentling.testing.check_model` runs an adapter through a fixed script: a text turn ("Reply with exactly the word: pong"), then a turn that offers an `echo` tool. With a recorded fixture that has a third exchange, it runs a third turn that must raise a `ModelError`. It then reports eight rules:

| Rule | Fails when |
| --- | --- |
| 1 text reassembles | the text turn reassembles to empty content |
| 2 finish_reason once | a turn yields no finish reason, or more than one |
| 3 usage present | a turn yields no usage, or a count that isn't a non-negative integer |
| 4 tool call reassembles | the tool turn has no named call with parseable arguments; skipped with `expects_tool_calls=False` |
| 5 only ModelError escapes | any other exception escapes, or the third turn raises nothing |
| 6 inputs not mutated | `messages` or `tools` changed during a call |
| 7 provider_data serialisable | `json.dumps` fails on it |
| 8 no empty Delta | a delta carries nothing |

Rule 3 is stricter than contract rule 2: the checker expects usage, because a backend that never reports it can't be checked for it. A turn that raises fails every rule that needed its output, so one bug doesn't hide behind another.

This model never yields a finish reason, and the report says which rule that breaks:

```python
import asyncio

from agentling import ChatMessage, ToolCall, Usage
from agentling.testing import ScriptedModel, check_model

turns = [
    ChatMessage("assistant", "pong", usage=Usage(5, 1)),
    ChatMessage(
        "assistant",
        tool_calls=[ToolCall("c1", "echo", {"text": "ping"})],
        usage=Usage(9, 4),
        finish_reason="tool_calls",
    ),
]

report = asyncio.run(check_model(lambda transport: ScriptedModel(turns), live=True))
print("ok:", report.ok)
print(report.rules[1])
```

```text
ok: False
rule 2 (finish_reason once): failed: finish_reason was never yielded (turn 1)
```

In a test, `report.raise_for_failures()` raises `AssertionError` listing every failed rule. [Write a model adapter](/docs/how-to/write-a-model-adapter) walks through building one that passes, and the [testing reference](/docs/reference/testing) lists every function.
