---
title: Run a local model
slug: run-a-local-model
description: Run an agent on Ollama, LM Studio or vLLM on your own machine.
order: 2
metaTitle: "Run Agentling on a local model"
metaDescription: "Point Agentling at Ollama, LM Studio or vLLM with a copied reference adapter, then check the adapter against a recording before you rely on it."
---

A local server needs no API key and sends nothing off your machine. Agentling talks to it through a model adapter, the same as any hosted model. Two reference adapters cover the common servers; copy one into your app.

| Server | Adapter | Base URL |
| --- | --- | --- |
| Ollama, its own API | `ollama_native.py`, `OllamaModel` | `http://localhost:11434` |
| Ollama, OpenAI-compatible | `openai_chat.py`, `OpenAIChatModel` | `http://localhost:11434/v1` |
| LM Studio | `openai_chat.py`, `OpenAIChatModel` | `http://localhost:1234/v1` |
| vLLM | `openai_chat.py`, `OpenAIChatModel` | `http://localhost:8000/v1` |

Both files are in [`examples/providers/`](https://github.com/lunarstack-co/agentling/tree/v0.2.0/examples/providers) and need `httpx`.

## Use Ollama's own API

Pull a model that supports tool calling, then build an `OllamaModel` with its tag:

```bash
ollama pull qwen3:8b
```

```python
# not executed: needs a running Ollama server
import asyncio

from agentling import Agent, tool
from examples.providers.ollama_native import OllamaModel  # your copy of the adapter


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


async def main() -> None:
    agent = Agent(model=OllamaModel("qwen3:8b"), tools=[add])
    print(await agent.run("What is 19 + 23? Use the add tool."))


asyncio.run(main())
```

The native adapter handles what Ollama does differently: the stream is newline-delimited JSON, tool results are matched by tool name, `done_reason` says `"stop"` even after a tool call, and the model's thinking arrives as reasoning. The first request can take a while as Ollama loads the model, so the adapter's default timeout is 120 seconds.

Ollama truncates a prompt that's too long instead of rejecting it, so this adapter never raises `ModelContextLengthError`. If long runs start to lose their beginning, raise the model's context with `extra_body={"options": {"num_ctx": 16384}}` or trim the conversation with a [context manager](/docs/how-to/trim-context).

## Use an OpenAI-compatible server

Ollama's `/v1`, LM Studio and vLLM copy OpenAI's chat API, so `OpenAIChatModel` works with each. Pass the server's base URL and the model name it expects. Local servers need no key, but the adapter falls back to `OPENAI_API_KEY`, so pass a placeholder to keep a real key off your local traffic:

```python
from examples.providers.openai_chat import OpenAIChatModel

ollama = OpenAIChatModel("qwen3:8b", base_url="http://localhost:11434/v1", api_key="local")
lm_studio = OpenAIChatModel("qwen3-8b", base_url="http://localhost:1234/v1", api_key="local")
vllm = OpenAIChatModel("Qwen/Qwen3-8B", base_url="http://localhost:8000/v1", api_key="local")

for model in (ollama, lm_studio, vllm):
    print(model.base_url)
```

```text
http://localhost:11434/v1
http://localhost:1234/v1
http://localhost:8000/v1
```

Some servers send tool calls without ids. Agentling makes one up, so you don't have to handle it. Server options that aren't part of OpenAI's API, such as vLLM's sampling extras, go in `extra_body`, which is merged into every request last.

## Check the adapter against your server

Small local models don't always call a tool when asked, so check the adapter before you build on it. Record your server once, from a clone of the agentling repository, where `record.py` lives:

```bash
uv run python -m examples.providers.record ollama_native \
    --base-url http://localhost:11434 --model qwen3:8b --out tests/fixtures/ollama_native.jsonl
```

The command prints one line per contract rule and exits with 1 if any failed. Then replay the recording in your tests, with no server running:

```python
import asyncio

from agentling.testing import check_model
from examples.providers.ollama_native import OllamaModel


def build(transport):
    return OllamaModel("qwen3:8b", transport=transport)


report = asyncio.run(check_model(build, recorded="tests/fixtures/ollama_native.jsonl"))
report.raise_for_failures()
print("ok:", report.ok)
print("tool call:", report.turns[1].tool_calls[0].name)
```

```text
ok: True
tool call: echo
```

The fixture this block reads is the one shipped with Agentling: lines 1 and 2 were recorded against Ollama with `qwen3:8b`, and line 3, a "model not found" error, was added by hand so that rule 5 checks the adapter's error mapping. A fixture you record holds only the first two; append an error line yourself to get the same check.

For a backend neither file covers, see [Write a model adapter](/docs/how-to/write-a-model-adapter).
