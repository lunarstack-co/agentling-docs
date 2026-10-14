---
title: Introduction
slug: introduction
description: What Agentling is, the idea behind it, and when to reach for it.
order: 1
metaTitle: "What Agentling is and when to use it"
metaDescription: "What Agentling is, the loop it is built on, what you get (typed memory, streamed events, self-healing tools, skills), and when to use something else."
---

Agentling is a small async Python framework for building tool-using agents. It gives you a clean ReAct loop, typed memory, streaming events, and recoverable failures in an auditable codebase.

The design centers on one core idea: an agent is a loop that combines a model, tools, and a memory of past turns to choose further actions until it finishes. Features like streaming, skills, self-healing, and persistence are layered directly onto this single loop.

## Why Agentling

- **Async first.** The loop, tools, and model calls are async. Tool calls in a single step run concurrently by default.
- **One code path.** Blocking and streaming modes share the exact same async generator. Blocking mode drains the stream for you.
- **Typed memory.** Runs are lists of typed step objects, not raw message dictionaries. Steps render themselves into model messages and serialize to JSON for offline replay and persistence.
- **Progressive skills.** Place a `SKILL.md` folder into your project. The model only sees its name and summary until it decides to load the full instructions.
- **Self-healing.** When a tool raises an exception, the loop turns it into an observation with recovery guidance so the model can correct its arguments instead of crashing.
- **Auditable codebase.** No metaclasses, no plugin registries, and no domain-specific languages. The framework consists of a few concise modules backed by extensive tests.

## Basic example

```python
import asyncio

from agentling import Agent, OpenAIModel, tool


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city.

    Args:
        city: The city to look up.
    """
    return f"It is 22C and sunny in {city}."


async def main() -> None:
    agent = Agent(model=OpenAIModel("gpt-4o-mini"), tools=[get_weather])
    print(await agent.run("What's the weather in Paris?"))


asyncio.run(main())
```

The `@tool` decorator inspects your function signature to build a schema-validated tool, and `Agent.run` executes the loop until the model returns its final text.

## When to use it

Agentling suits projects where you need full visibility into agent operations: backend workers calling trusted tools, CLI assistants, resumable background processes, or test harnesses where runs must be recorded and replayed deterministically.

To keep the codebase focused, several features remain out of scope: there is no hosted tracing backend, no execution sandbox, and no automatic prompt summarization. Review the [requirements and scope boundaries](/docs/getting-started/installation#requirements) for details on customizing these layers through public APIs.

## Next steps

- [Install Agentling](/docs/getting-started/installation)
- [Quickstart guide](/docs/getting-started/quickstart)
- [The agent loop](/docs/core-concepts/agent-loop)
