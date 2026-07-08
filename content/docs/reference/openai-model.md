---
title: OpenAIModel
slug: openai-model
description: The built-in provider adapter, its retry policy, and the Model protocol for custom adapters.
order: 2
---

`OpenAIModel` is an adapter for any OpenAI-compatible chat-completions endpoint. It is the only place in agentling that knows OpenAI's wire format: it converts framework-neutral `ChatMessage` lists into provider payloads on the way out and converts responses back on the way in.

## OpenAIModel(...)

```python
from agentling import OpenAIModel

model = OpenAIModel(
    "llama-3.1-70b",
    base_url="http://localhost:8000/v1",
    api_key="not-needed-locally",
)
```

| Parameter | Default | Description |
| --- | --- | --- |
| `model` | required | The model name to request. |
| `api_key` | env | Falls back to the OpenAI SDK's environment configuration, typically `OPENAI_API_KEY`. |
| `base_url` | `None` | Point at any OpenAI-compatible endpoint. |
| `context_window` | `128_000` | Advertised context window for this model. |
| `max_retries` | `2` | Retries after the initial request for transient errors. |
| `retry_base_delay` | `0.5` | Initial backoff delay in seconds. It doubles on each retry. |

## Retry policy

The adapter classifies failures before deciding whether to retry:

- **Transient failures are retried** with exponential backoff: rate limits, connection errors, timeouts, and 5xx responses. With the defaults, a request is attempted up to three times in total, waiting 0.5 seconds and then 1 second between attempts.
- **Permanent errors fail fast** without retrying: a bad request or bad auth returns immediately, because retrying them cannot succeed.

See [Errors](/docs/reference/errors) for how model failures surface to your code.

## Compatible endpoints

Because the adapter speaks the OpenAI chat-completions protocol, `base_url` lets you use a local server, a gateway, or another vendor's compatible API without touching the rest of your agent. See [Using other providers](/docs/guides/other-providers) for worked examples.

## The Model protocol

Any object implementing the `Model` protocol works as an agent's model, so you can write your own adapter for a provider with a different wire format:

```python
class Model(Protocol):
    async def generate(self, messages, tools=None) -> ChatMessage: ...
    def stream(self, messages, tools=None) -> AsyncIterator[Delta]: ...
```

`generate` returns one complete `ChatMessage`. `stream` yields `Delta` objects: small chunks of content or fragments of a tool call. The module-level `agglomerate_deltas` function reassembles a delta stream back into a single `ChatMessage`, which is how the loop can stream text to the user and still execute tools from a complete message. Swapping providers means writing one adapter, not touching the loop.

## Related pages

- [The agent loop](/docs/core-concepts/agent-loop) shows where the model is called on each step.
- [Streaming events](/docs/core-concepts/streaming-events) covers what the loop does with each `Delta`.
