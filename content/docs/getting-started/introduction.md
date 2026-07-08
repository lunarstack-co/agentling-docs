---
title: Introduction
slug: introduction
description: What agentling is, the idea behind it, and when to reach for it.
order: 1
---

agentling is a tiny async framework for building reliable, observable, tool-using agents in Python. It gives you a clean ReAct loop, typed memory, streaming events, recoverable failures, and progressive-disclosure skills, in a codebase small enough to read in one sitting.

The framework is built around one idea: an agent is a loop that turns a model, some tools, and a memory of what happened into more actions, until it has an answer. Everything else, including streaming, skills, self-healing, and persistence, is a thin layer on top of that loop.

## Why agentling

- **Async first.** The loop, tools, and model calls are all `async`. Tool calls in a single step run concurrently by default.
- **One code path.** Blocking and streaming share the exact same loop. There is a single async generator; blocking mode just drains it.
- **Typed memory.** A run is a list of typed steps, not a bag of raw messages. Steps know how to render themselves back into model messages and serialize to JSON for persistence and replay.
- **Progressive-disclosure skills.** Drop a `SKILL.md` folder in and the model sees only its name and description until it decides to load it. Big skill libraries stay cheap.
- **Self-healing.** A tool that raises becomes an observation the model can recover from, not a crash.
- **Small and readable.** No metaclasses, no plugin registry, no DSL. Around 800 lines of source you can actually read.

## A taste of the API

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

That is a complete, working agent. The `@tool` decorator turns a plain function into a schema-validated tool, and `Agent.run` drives the loop until the model produces an answer.

## When to use it

agentling is a good fit when you want to understand and control every part of your agent: a service that calls a handful of trusted tools, a CLI assistant, a background worker that needs resumable runs, or a research harness where you want full visibility into each step.

It is deliberately small, so some things are out of scope: there is no built-in tracing backend, no sandboxing, and no automatic context summarization. The [Limitations](/docs/getting-started/installation#requirements) are documented honestly, and the hooks to build those layers yourself are part of the public API.

## Status

agentling is in alpha (0.x). The API may still change before 1.0. Follow the [changelog](/changelog) for release notes.

## Next steps

- [Install agentling](/docs/getting-started/installation)
- [Build your first agent](/docs/getting-started/quickstart)
- [Understand the agent loop](/docs/core-concepts/agent-loop)
