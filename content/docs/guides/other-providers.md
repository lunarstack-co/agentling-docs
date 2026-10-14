---
title: Using Other Providers
slug: other-providers
description: Point OpenAIModel at any OpenAI-compatible endpoint, or implement the Model protocol for a custom provider.
order: 5
metaTitle: "Use other providers with OpenAIModel or Model"
metaDescription: "Point OpenAIModel at any OpenAI-compatible endpoint, or implement the small Model protocol to plug in a provider of your own."
---

agentling ships one provider adapter, `OpenAIModel`, but it is not tied to OpenAI. The adapter speaks to any OpenAI-compatible chat-completions endpoint, and the `Model` protocol lets you write your own adapter for anything else.

## OpenAI-compatible endpoints

Point `OpenAIModel` at a different `base_url` to use a local server, a gateway, or another vendor's OpenAI-compatible API:

```python
from agentling import OpenAIModel

model = OpenAIModel(
    "llama-3.1-70b",
    base_url="http://localhost:8000/v1",
    api_key="not-needed-locally",
)
```

When `api_key` is omitted, the adapter falls back to the OpenAI SDK's environment configuration, so `OPENAI_API_KEY` keeps working as usual.

## Retry behavior and tuning

Transient failures (rate limits, connection or timeout errors, 5xx responses) are retried with exponential backoff. Permanent errors, such as a bad request or bad auth, fail fast without retrying. See [Error Handling](/docs/guides/error-handling) for the full failure model.

| Parameter | Default | Description |
| --- | --- | --- |
| `model` | required | The model name to request. |
| `api_key` | env | Falls back to the OpenAI SDK's environment configuration. |
| `base_url` | `None` | Point at any OpenAI-compatible endpoint. |
| `context_window` | `128_000` | Advertised context window for this model. |
| `max_retries` | `2` | Retries after the initial request for transient errors. |
| `retry_base_delay` | `0.5` | Initial backoff delay in seconds (doubles each retry). |

## Writing a custom adapter

Any object implementing the `Model` protocol works:

```python
class Model(Protocol):
    async def generate(self, messages, tools=None) -> ChatMessage: ...
    def stream(self, messages, tools=None) -> AsyncIterator[Delta]: ...
```

`generate` returns one complete `ChatMessage`. `stream` yields `Delta` objects: small chunks of content or fragments of a tool call. The loop reassembles the delta stream into a single message with `agglomerate_deltas`, so your adapter only needs to translate wire chunks into deltas.

## Why the boundary is clean

Everything above the provider speaks framework-neutral types, never vendor payloads:

- `ChatMessage` is the one message type used internally: a role, content, optional tool calls, an optional tool-call id, and optional usage.
- `ToolCall` is a provider-neutral tool call: an id, a name, and a parsed arguments dict.
- `Usage` is input and output token counts, with a `total_tokens` property.

`OpenAIModel` is the only place that knows OpenAI's wire format. It converts `ChatMessage` lists into OpenAI messages on the way out and converts responses back on the way in. Swapping providers means writing one adapter, not touching the loop.

## Related pages

- [The agent loop](/docs/core-concepts/agent-loop): how the loop consumes a model.
- [OpenAIModel reference](/docs/reference/openai-model): every constructor parameter.
