---
title: Write a model adapter
slug: write-a-model-adapter
description: Turn any model backend into an object Agentling can run, and prove it follows the contract.
order: 1
metaTitle: "Write a model adapter for Agentling"
metaDescription: "Write a stream() method that turns your backend's response into Deltas, map its errors to ModelError classes, and check it with check_model."
---

An adapter is one class with one method, `stream(messages, tools)`. It turns Agentling's messages into your backend's request and your backend's response into `Delta`s. Agentling ships no adapter of its own, so this is how you connect any model.

Start from the reference adapter closest to your backend. Copy the file into your app; it isn't part of the installed package.

| Backend | Copy |
| --- | --- |
| OpenAI and every server that copies its chat API | [`openai_chat.py`](https://github.com/lunarstack-co/agentling/blob/v0.2.0/examples/providers/openai_chat.py) |
| The Anthropic Messages API | [`anthropic_messages.py`](https://github.com/lunarstack-co/agentling/blob/v0.2.0/examples/providers/anthropic_messages.py) |
| Ollama's own `/api/chat` | [`ollama_native.py`](https://github.com/lunarstack-co/agentling/blob/v0.2.0/examples/providers/ollama_native.py) |

The reference adapters use `httpx` (`pip install httpx`). Your adapter can use any client.

## 1. Yield deltas from `stream`

`stream` is an async generator. Each `Delta` carries any of `content`, `reasoning`, `tool_calls`, `usage`, `finish_reason` and `provider_data`. `provider_data` on its own doesn't count as carrying something (contract rule 1, and `check_model` rule 8 fails it), so attach it to the delta that carries the usage or the finish reason. A tool call arrives as `ToolCallDelta` fragments grouped by `index`; the id, the name and pieces of the JSON arguments can each come in a different fragment.

This adapter stands in for a streaming backend. It answers "pong" to plain text and calls the `echo` tool when one is offered:

```python
import asyncio
from collections.abc import AsyncIterator, Sequence

from agentling import ChatMessage, Delta, ToolCallDelta, ToolDefinition, Usage
from agentling.testing import check_model


class CannedModel:
    async def stream(
        self,
        messages: Sequence[ChatMessage],
        tools: Sequence[ToolDefinition] = (),
    ) -> AsyncIterator[Delta]:
        if tools:
            yield Delta(tool_calls=[ToolCallDelta(0, "call_1", "echo", '{"text": ')])
            yield Delta(tool_calls=[ToolCallDelta(0, arguments='"ping"}')])
            yield Delta(usage=Usage(12, 5), finish_reason="tool_calls")
        else:
            for piece in ("po", "ng"):
                yield Delta(content=piece)
            yield Delta(usage=Usage(10, 1), finish_reason="stop")


report = asyncio.run(check_model(lambda transport: CannedModel(), live=True))
print(report)
```

```text
rule 1 (text reassembles): passed
rule 2 (finish_reason once): passed
rule 3 (usage present): passed
rule 4 (tool call reassembles): passed
rule 5 (only ModelError escapes): passed
rule 6 (inputs not mutated): passed
rule 7 (provider_data serialisable): passed
rule 8 (no empty Delta): passed
```

`check_model` runs a text turn and a tool turn and checks the result against the contract. With `live=True` it hands your factory `None` and calls the model for real; here the model needs no network, so the factory ignores the argument.

## 2. Follow the seven rules

The `Model` protocol's docstring lists them, and [The model contract](/docs/concepts/the-model-contract) explains why each exists. In short:

1. Yield nothing until a `Delta` carries something. The loop only retries a turn that failed before its first `Delta`.
2. Yield `usage` when the backend reports it, and none when it doesn't.
3. Yield `finish_reason` exactly once.
4. Raise only `ModelError` subclasses, and never retry yourself.
5. Never change the `messages` or `tools` you were given.
6. Render the system message and tool results however the backend needs.
7. Keep your own data in `provider_data` under one key named after your adapter, and make it JSON-serialisable.

## 3. Map failures to `ModelError` classes

Raise the class that says what went wrong. Its `retryable` default tells the loop whether trying again can help, so the loop, not your adapter, decides when to retry. Pass `retry_after` when the backend says how long to wait, and `status` when there was an HTTP status.

| Failure | Raise |
| --- | --- |
| DNS, refused or dropped connection | `ModelConnectionError` |
| HTTP 429 | `ModelRateLimitError(retry_after=...)` |
| HTTP 5xx or an overload | `ModelServerError` |
| The request timed out | `ModelTimeoutError` |
| HTTP 401 or 403 | `ModelAuthError` |
| The prompt no longer fits | `ModelContextLengthError` |
| Any other 4xx | `ModelBadRequestError` |

The [errors reference](/docs/reference/errors) lists every class with its default. A transport or vendor exception that escapes your adapter is a bug: it reaches the caller unchanged and the loop never retries it.

## 4. Use your adapter

A real adapter talks to the network, so this block needs a key:

```python
# not executed: needs an API key
import asyncio

from agentling import Agent
from examples.providers.openai_chat import OpenAIChatModel  # your copy of the adapter


async def main() -> None:
    agent = Agent(model=OpenAIChatModel("gpt-4o-mini"))  # reads OPENAI_API_KEY
    print(await agent.run("Reply with one word: hello"))


asyncio.run(main())
```

## 5. Check it against a recording

Live checks depend on the model behaving. For tests, record the backend once and replay it.

For one of the three reference adapters, `record.py` does this for you. It lives in the agentling repository, so run it from a clone; it runs the same script as `check_model` against a live backend and writes every exchange to a fixture, with API keys in headers redacted:

```bash
uv run python -m examples.providers.record openai_chat \
    --model gpt-4o-mini --api-key-env OPENAI_API_KEY --out tests/fixtures/openai_chat.jsonl
```

For your own adapter, wrap its transport in `RecordingTransport`, run `check_model` live and write what it captured with `write_fixture`. Here a mock stands in for the live backend, so the block runs anywhere:

```python
import asyncio
import tempfile
from pathlib import Path

import httpx

from agentling.testing import RecordingTransport, check_model, read_fixture, write_fixture
from examples.providers.openai_chat import OpenAIChatModel

# A stand-in for your live backend: it answers with two recorded responses.
responses = iter(read_fixture("tests/fixtures/openai_chat.jsonl")[:2])


def backend(request: httpx.Request) -> httpx.Response:
    exchange = next(responses)
    headers = {"content-type": exchange.headers.get("content-type", "text/event-stream")}
    return httpx.Response(exchange.status, headers=headers, text="\n".join(exchange.body_lines))


async def main() -> None:
    recorder = RecordingTransport(inner=httpx.MockTransport(backend))

    def build(transport):
        return OpenAIChatModel("gpt-4o-mini", api_key="sk-live-key", transport=recorder)

    report = await check_model(build, live=True)
    out = Path(tempfile.mkdtemp()) / "my_adapter.jsonl"
    write_fixture(out, recorder.exchanges)

    print("ok:", report.ok)
    print("exchanges:", len(read_fixture(out)))
    print("key stored as:", recorder.exchanges[0].request["headers"]["authorization"])


asyncio.run(main())
```

```text
ok: True
exchanges: 2
key stored as: ‹redacted›
```

A recording holds the text turn and the tool turn. To have rule 5 check your error mapping too, append a third line by hand with an error response from your backend's documentation, as the [shipped fixtures](https://github.com/lunarstack-co/agentling/blob/v0.2.0/examples/providers/fixtures/README.md) do. Read a fixture before you commit it: request bodies are recorded as sent.

In recorded mode `check_model` hands your factory an httpx transport that replays the fixture, so your adapter must accept a transport and pass it to its client. This runs the OpenAI-compatible adapter against a recorded text turn, tool turn and HTTP 429:

```python
import asyncio

from agentling.testing import check_model
from examples.providers.openai_chat import OpenAIChatModel


def build(transport):
    return OpenAIChatModel("gpt-4o-mini", api_key="unused", transport=transport)


report = asyncio.run(check_model(build, recorded="tests/fixtures/openai_chat.jsonl"))
report.raise_for_failures()
print("ok:", report.ok)
```

```text
ok: True
```

A fixture's third exchange, when it has one, must make the adapter raise a `ModelError`; rule 5 checks it. `raise_for_failures()` raises `AssertionError` listing every failed rule, so it drops straight into a pytest test.

Once your adapter passes, connect it to an agent as in [Connect a real model](/docs/tutorial/connect-a-model), or point it at a local server with [Run a local model](/docs/how-to/run-a-local-model).
