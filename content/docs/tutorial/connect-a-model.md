---
title: Connect a real model
slug: connect-a-model
description: Copy a reference adapter, swap it in for the scripted model, and check it follows the contract.
order: 5
metaTitle: "Connect your agent to a real model"
metaDescription: "Copy Agentling's OpenAI-compatible adapter into your project, run the agent against a real model, and prove the adapter works with check_model."
---

By the end of this chapter your agent will run against a real model through an adapter you own, and you'll have a check that proves the adapter follows Agentling's model contract, without spending a token.

**You need:** the program from [Add skills](/docs/tutorial/skills), and for the live run an OpenAI API key or any server that speaks the OpenAI chat API.

Agentling ships no model adapters. A model is any object with a `stream(messages, tools)` method, so the code that talks to your provider is a file in your project that you can read and change. The Agentling repository has three to start from: OpenAI-compatible servers, Anthropic, and Ollama.

## 1. Copy an adapter into your project

Download the OpenAI-compatible adapter and the recorded responses that come with it, and install `httpx`, which the adapter uses:

```bash
curl -O https://raw.githubusercontent.com/lunarstack-co/agentling/v0.2.0/examples/providers/openai_chat.py
mkdir -p tests/fixtures
curl -o tests/fixtures/openai_chat.jsonl https://raw.githubusercontent.com/lunarstack-co/agentling/v0.2.0/examples/providers/fixtures/openai_chat.jsonl
pip install httpx
```

The [adapter](https://github.com/lunarstack-co/agentling/blob/v0.2.0/examples/providers/openai_chat.py) is one class, `OpenAIChatModel`. It works with OpenAI and with anything that copies its API: LM Studio, vLLM, Ollama's `/v1` endpoint, OpenRouter and Gemini's compatibility endpoint. Set `base_url` to point it elsewhere.

In your project you import it from the file you saved, `from openai_chat import OpenAIChatModel`. The examples on this site import it from where it sits in the Agentling repository, `examples.providers.openai_chat`, so they can run in the docs' test suite.

## 2. Swap the scripted model for the real one

Replace `ScriptedModel` with the adapter. Nothing else changes: the tools, the skill and the event handling stay as they were. The adapter reads `OPENAI_API_KEY` from the environment unless you pass `api_key`.

```python
# not executed: needs an OpenAI API key
import asyncio

from agentling import Agent, print_events, tool
from examples.providers.openai_chat import OpenAIChatModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


async def main() -> None:
    agent = Agent(model=OpenAIChatModel("gpt-4o-mini"), tools=[add])
    await print_events(agent.run("What is 19 + 23?", stream=True))


asyncio.run(main())
```

A real model decides for itself, so its wording will differ from run to run. You'll see the `add` call, its result, and an answer.

## 3. See how a failure arrives

The adapter turns HTTP failures into the same `ModelError` classes you met in [Handle failures](/docs/tutorial/handle-failures). You can see it without a key: the adapter takes an httpx `transport`, and this one answers every request with a 401.

```python
import asyncio

import httpx

from agentling import Agent, ModelAuthError
from examples.providers.openai_chat import OpenAIChatModel


def refuse(request: httpx.Request) -> httpx.Response:
    return httpx.Response(401, json={"error": {"message": "Incorrect API key provided."}})


async def main() -> None:
    model = OpenAIChatModel(
        "gpt-4o-mini", api_key="sk-wrong", transport=httpx.MockTransport(refuse)
    )
    try:
        await Agent(model=model).run("Hello")
    except ModelAuthError as error:
        print(type(error).__name__, error.status, error.retryable)
        print(error)


asyncio.run(main())
```

```text
ModelAuthError 401 False
HTTP 401 from the model endpoint: Incorrect API key provided.
```

A bad key isn't retryable, so the run stops at once with an error you can show your user. A 429 or a 5xx would have been retried first.

## 4. Check the adapter follows the contract

The loop relies on a few rules every adapter must keep: say why a turn finished exactly once, report token usage, raise only `ModelError` subclasses, never change the messages it was given, and so on. `check_model` from `agentling.testing` runs an adapter through a short fixed script (a text turn, then a turn that must call an `echo` tool) and reports each rule.

Run it against the recorded responses you downloaded, and it needs no key and no network. The factory you pass receives an httpx transport that replays the recording.

```python
import asyncio

from agentling.testing import check_model
from examples.providers.openai_chat import OpenAIChatModel


def build(transport):
    return OpenAIChatModel("gpt-4o-mini", api_key="unused", transport=transport)


report = asyncio.run(check_model(build, recorded="tests/fixtures/openai_chat.jsonl"))
print(report)
print("ok:", report.ok)
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
ok: True
```

To check against your real provider instead, pass `live=True` in place of `recorded=...`; the factory then receives `None` and the adapter uses the network. If you change the adapter, run the check again. The [model contract](/docs/concepts/the-model-contract) explains each rule, and [Write a model adapter](/docs/how-to/write-a-model-adapter) covers writing one for a provider that isn't OpenAI-compatible.

## The complete program

The skills program with the real model. By default it runs the offline check and stops; `python connect_a_model.py --live` runs the agent against OpenAI.

```python title="connect_a_model.py"
import asyncio
import sys
import tempfile
from pathlib import Path

from agentling import (
    Agent,
    Event,
    FinalEvent,
    TextDelta,
    ToolCallEvent,
    ToolResultEvent,
    tool,
)
from agentling.testing import check_model
from examples.providers.openai_chat import OpenAIChatModel  # your copy of the adapter

MODEL_NAME = "gpt-4o-mini"
FIXTURE = "tests/fixtures/openai_chat.jsonl"

SKILL_MD = """---
name: show-working
description: Show each calculation step before giving an arithmetic answer.
---

# Show your working

For any arithmetic question:

1. Call one tool per operation.
2. List each call and its result, one per line.
3. Give the answer last, on its own line.
"""


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a * b


@tool
def divide(a: float, b: float) -> float:
    """Divide a by b.

    Args:
        a: The number to divide.
        b: The number to divide by.
    """
    return a / b


def render(event: Event) -> None:
    match event:
        case TextDelta(text=text):
            print(text, end="", flush=True)
        case ToolCallEvent(tool_call=call):
            print(f"\n  -> {call.name}({call.arguments})")
        case ToolResultEvent(result=result):
            mark = "error" if result.is_error else "ok"
            print(f"  <- {result.name} [{mark}]: {result.content.splitlines()[0]}")
        case FinalEvent():
            print()


def write_skill(root: Path) -> Path:
    folder = root / "show-working"
    folder.mkdir()
    (folder / "SKILL.md").write_text(SKILL_MD)
    return folder


async def check_adapter() -> None:
    def build(transport):
        return OpenAIChatModel(MODEL_NAME, api_key="unused", transport=transport)

    report = await check_model(build, recorded=FIXTURE)
    print("adapter check:", "ok" if report.ok else "failed")
    report.raise_for_failures()


async def run_live() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        agent = Agent(
            model=OpenAIChatModel(MODEL_NAME),
            tools=[add, multiply, divide],
            skills=[write_skill(Path(tmp))],
        )
        async for event in agent.run("What is (19 + 23) * 2?", stream=True):
            render(event)


async def main() -> None:
    await check_adapter()
    if "--live" in sys.argv:
        await run_live()
    else:
        print("Run with --live to call the model.")


if __name__ == "__main__":
    asyncio.run(main())
```

Without `--live` it prints:

```text
adapter check: ok
Run with --live to call the model.
```

## What you built

An agent running on a model adapter you own, and a check, runnable offline, that the adapter keeps the contract the loop depends on. Next, you'll write tests for the agent itself, so a change to a tool or a prompt can't quietly break it: [Test your agent](/docs/tutorial/test-your-agent).
