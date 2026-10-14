---
title: Quickstart
slug: quickstart
description: Build, run, and stream your first agent in a few lines of Python.
order: 3
metaTitle: "Quickstart: build and stream your first agent"
metaDescription: "Define a tool with @tool, create an Agent with a model, run it, then stream events from the same loop. About 30 lines of Python from start to finish."
---

This page takes you from an empty file to a streaming agent with one tool.

## 1. Define a tool

A tool is any Python function wrapped with `@tool`. The function name becomes the tool name, the docstring summary becomes the description, and the type hints plus a Google-style `Args:` section become the JSON Schema the model sees.

```python
from agentling import tool


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b
```

## 2. Run an agent

`Agent` is immutable configuration: a model, some tools, and settings. `run()` drives the loop until the model produces an answer.

```python
import asyncio

from agentling import Agent, OpenAIModel, tool


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


async def main() -> None:
    agent = Agent(model=OpenAIModel("gpt-4o-mini"), tools=[add])
    answer = await agent.run("What is 19 + 23, and why?")
    print(answer)


asyncio.run(main())
```

Behind the scenes the loop sends your task to the model, executes the `add` tool call it requests, feeds the result back, and returns the model's final text.

## 3. Stream the run

Pass `stream=True` to get an async iterator of typed events instead of a single string. The `print_events` helper consumes that stream and renders a live CLI view:

```python
import asyncio

from agentling import Agent, OpenAIModel, print_events, tool


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


async def main() -> None:
    agent = Agent(model=OpenAIModel("gpt-4o-mini"), tools=[add])
    answer = await print_events(agent.run("What is 19 + 23?", stream=True))
    print("\nFinal answer:", answer)


asyncio.run(main())
```

> [!TIP]
> Blocking and streaming share the same loop, so there is no behavioral difference between the two modes beyond how you consume the output. Prototype with blocking `run()` and switch to streaming later without changing agent behavior.

## Where to go next

- [The agent loop](/docs/core-concepts/agent-loop): what happens inside one step.
- [Tools](/docs/core-concepts/tools): schemas, validation, and error recovery.
- [Streaming events](/docs/core-concepts/streaming-events): every event type and how to consume them.
- [Skills](/docs/core-concepts/skills): give the agent instructions it loads on demand.
