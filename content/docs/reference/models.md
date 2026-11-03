---
title: Models and message types
slug: models
description: The Model protocol, the message and streaming types, and the helpers that join and split deltas.
order: 3
metaTitle: "Models and message types reference"
metaDescription: "The Model protocol, ChatMessage, ToolCall, Delta, ToolCallDelta, Usage, ToolDefinition and FinishReason, plus agglomerate_deltas and deltas_from_message."
---

`agentling.models` defines what a model is and the types that pass between the loop and a model adapter. Agentling ships no adapter; see [Write a model adapter](/docs/how-to/write-a-model-adapter) and [The model contract](/docs/concepts/the-model-contract) for the rules an adapter follows.

## Model

```text
class Model(Protocol):
    def stream(
        self,
        messages: Sequence[ChatMessage],
        tools: Sequence[ToolDefinition] = (),
    ) -> AsyncIterator[Delta]: ...
```

Any object with this method is a model; write it as an `async def` that yields. `Agent()` raises `TypeError` for an object without a callable `stream`, or one whose `stream` is a coroutine function rather than an async generator.

## ChatMessage

```text
ChatMessage(role, content="", tool_calls=[], tool_call_id=None, usage=None,
            reasoning=None, finish_reason=None, provider_data=None)
```

| Field | Default | Meaning |
| --- | --- | --- |
| `role` | required | `"system"`, `"user"`, `"assistant"` or `"tool"` (the `Role` type). |
| `content` | `""` | The text. |
| `tool_calls` | `[]` | `ToolCall`s an assistant turn asked for. |
| `tool_call_id` | `None` | On a `"tool"` message, the id of the call it answers. |
| `usage` | `None` | Token counts for an assistant turn. |
| `reasoning` | `None` | Reasoning text the model showed, kept apart from the answer. |
| `finish_reason` | `None` | Why the turn stopped. |
| `provider_data` | `None` | Adapter-owned data, keyed by adapter name, sent back on later turns. Must be JSON-serialisable. |

## ToolCall

`ToolCall(id: str, name: str, arguments: dict[str, Any])`: a tool call the model asked for, with its arguments parsed.

## ToolDefinition

`ToolDefinition(name: str, description: str, parameters: dict[str, Any])`, frozen: what a model is told about one tool. `parameters` is a JSON Schema object. `Tool.definition` returns one, and each adapter renders it in its backend's format.

## Delta

```text
Delta(content=None, tool_calls=[], usage=None, reasoning=None,
      finish_reason=None, provider_data=None)
```

One streamed chunk of a model turn. Every field is optional, but a `Delta` should carry at least one.

| Field | Meaning |
| --- | --- |
| `content` | A piece of answer text. |
| `tool_calls` | `ToolCallDelta` fragments. |
| `usage` | Token counts. The last one in a turn wins. |
| `reasoning` | A piece of reasoning text. |
| `finish_reason` | Why the turn stopped. Yield it once. |
| `provider_data` | Adapter data to store with the turn. The last one wins. |

## ToolCallDelta

`ToolCallDelta(index: int, id: str | None = None, name: str | None = None, arguments: str | None = None)`: a piece of a streamed tool call. Pieces with the same `index` belong to one call; `arguments` pieces are joined into JSON. A missing `id` is made up when the turn is joined.

## Usage

`Usage(input_tokens: int, output_tokens: int, cached_input_tokens: int = 0, reasoning_tokens: int = 0)`, frozen. `cached_input_tokens` and `reasoning_tokens` are breakdowns already included in the two totals. `total_tokens` is `input_tokens + output_tokens`, and `+` adds two usages field by field.

## FinishReason

`Literal["stop", "tool_calls", "length", "content_filter", "error", "unknown"]`. Adapters map their backend's stop reasons onto these and use `"unknown"` for the rest. `"length"` on a turn whose tool call can't be parsed makes the loop raise `ModelOutputTruncatedError`.

## agglomerate_deltas

`agglomerate_deltas(deltas: Iterable[Delta]) -> ChatMessage`

Joins a turn's deltas into one assistant `ChatMessage`. Content, reasoning and each tool call's arguments are concatenated; for `usage`, `finish_reason` and `provider_data` the last one wins. Tool calls are ordered by `index`, and a call with no id gets `agentling_call_<index>_<8 hex characters>`.

**Raises** `ModelOutputError` when a tool call has no name, or its arguments aren't valid JSON or aren't a JSON object.

## deltas_from_message

`async deltas_from_message(message: ChatMessage) -> AsyncIterator[Delta]`

Yields a whole message as one `Delta`, for a backend that can't stream. Inside `stream()`: `async for delta in deltas_from_message(reply): yield delta`. See [`custom_model_generate_only.py`](https://github.com/lunarstack-co/agentling/blob/v0.2.0/examples/custom_model_generate_only.py).

## Example

```python
from agentling import ChatMessage, Delta, ToolCallDelta, Usage, agglomerate_deltas
from agentling import deltas_from_message

deltas = [
    Delta(content="Let me "),
    Delta(content="check."),
    Delta(tool_calls=[ToolCallDelta(0, None, "lookup", '{"city": ')]),
    Delta(tool_calls=[ToolCallDelta(0, arguments='"Paris"}')]),
    Delta(usage=Usage(12, 7), finish_reason="tool_calls"),
]
message = agglomerate_deltas(deltas)
call = message.tool_calls[0]

print(message.content)
print(call.name, call.arguments, call.id.startswith("agentling_call_0_"))
print(message.usage.total_tokens, message.finish_reason)

reply = ChatMessage("assistant", "Done.", finish_reason="stop")
print([delta async for delta in deltas_from_message(reply)][0].content)
```

Output:

```text
Let me check.
lookup {'city': 'Paris'} True
19 tool_calls
Done.
```
