---
title: Security and trust
slug: security-and-trust
description: What Agentling trusts, what it doesn't, and the settings that limit what reaches the model.
order: 4
metaTitle: "Security and trust in Agentling"
metaDescription: "Agentling runs the code you give it. Which inputs are trusted, why model output and tool results aren't, and how redact_errors and output caps help."
---

Agentling runs code you give it, in your process, with your privileges. It doesn't sandbox anything. Knowing where the trust boundaries are is how you build a safe harness on top of it.

## What is trusted

**Tools are trusted code.** A `@tool` function or `Tool` subclass runs in your process. Register only tools you trust. Agentling checks a tool's arguments against its schema, but that's a shape check, not a security check.

**Skills with `tools:` run code.** A `SKILL.md` can list tool entry points such as `my_package.lint_tools:run_ruff`. When the model loads that skill, each entry point is imported with `importlib`, which runs the module's top-level code. Load skills only from sources you'd import Python from.

**Your model adapter is trusted code.** It holds your API key and talks to the network. The reference adapters send the key only in the request header the backend expects.

## What is not trusted

**Everything the model produces.** Tool arguments come from the model, so treat them as untrusted input inside the tool. A tool that takes a path should check it stays where it should; a tool that runs a query should not build it from raw strings. The model can be steered by anything in its context.

**Everything a tool returns from outside.** Tool output goes back into the model's context. A web page, a file or an API response can contain text written to steer the model's next step, which is called prompt injection. Agentling can't tell instructions from data, so put an approval step in your harness before any tool that changes data or spends money.

## Settings that limit exposure

**`redact_errors=True`** keeps unexpected exception messages away from the model. Exceptions often carry paths, connection strings or secrets. With redaction on, the model sees only the exception type and the tool name; the full detail goes to the `agentling` logger:

```python
import asyncio
import logging

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel

logging.disable(logging.CRITICAL)  # keep the logged traceback out of this example


@tool
def connect() -> str:
    """Connect to the database."""
    raise ConnectionError("postgres://admin:hunter2@db.internal refused")


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("c1", "connect", {})]),
        ChatMessage("assistant", "The database is unavailable."),
    ]
)


async def main() -> None:
    session = Agent(model=model, tools=[connect], redact_errors=True).start()
    await session.run("Check the database.")
    print(session.memory.steps[1].tool_results[0].content)


asyncio.run(main())
```

```text
ConnectionError while running 'connect' (details suppressed).
```

A `ToolCallError`, raised for bad arguments, is always shown in full: the model needs the message to fix its call, so don't put secrets in one.

**`max_tool_output_chars`** on the agent, or `max_output_chars` on a tool, caps how much of a tool's output reaches the model. The middle is cut and the start and end kept. It limits both cost and how much injected text one result can carry.

**`tool_timeout`** on the agent, or `timeout` on a tool, stops the loop waiting on a slow tool and gives the model a timeout error instead. A sync tool already running in its worker thread can't be stopped and finishes in the background, so make tools that touch the outside world async where you can.

## Keep secrets out of the loop

Anything a tool returns or raises can reach the model, and memory saves it. Don't put secrets in return values or exception messages. `dump_json()` saves tool results as they were, so treat a saved session as sensitive as the conversation it holds.

When you record fixtures for adapter tests, `RecordingTransport` replaces keys in the `authorization`, `x-api-key` and `api-key` headers. Request bodies are recorded as sent, so read a fixture before you commit it.

## Concurrency is a boundary too

An `Agent` holds configuration only and is safe to share. Each session has its own memory, tools and interrupt flag, so concurrent runs never see each other's data, unless a tool keeps its own state: sessions share the agent's tool objects, so a tool that stores something stores it for every session. Give each user or conversation its own session.

## Reporting a vulnerability

Email me@folarin.dev rather than opening a public issue. The full policy is in [`SECURITY.md`](https://github.com/lunarstack-co/agentling/blob/v0.2.0/SECURITY.md).
