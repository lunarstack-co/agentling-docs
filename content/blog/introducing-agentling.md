---
title: Introducing agentling
slug: introducing-agentling
excerpt: A tiny async framework for reliable, observable, tool-using agents. Version 0.1.0 is out today, and the whole codebase is small enough to read in one sitting.
publishDate: 2026-07-07T09:00:00Z
authorName: Folarin Akinloye
tags:
  - release
  - announcement
featured: true
readingMinutes: 4
---

Today I am releasing agentling 0.1.0, a tiny async framework for building tool-using agents in Python. It gives you a clean ReAct loop, typed memory, streaming events, recoverable failures, and progressive-disclosure skills, in around 800 lines of source you can actually read.

## Why another agent framework

Most agent frameworks make a trade I was never comfortable with: power in exchange for opacity. You get orchestration graphs, plugin registries, and callback forests, and somewhere in the middle of all that your agent makes a decision you cannot explain.

agentling starts from the opposite end. An agent is a loop that turns a model, some tools, and a memory of what happened into more actions, until it has an answer. Everything else should be a thin, legible layer on top of that loop. If you can read the loop, you can trust the agent.

That principle shaped every design decision in the framework:

- **One code path.** Blocking and streaming share the exact same loop. There is a single async generator; blocking mode just drains it. There is no second implementation to keep in sync, and no behavioral drift between the two modes.
- **Typed memory.** A run is a list of typed steps, not a bag of raw messages. Steps serialize to JSON, so persistence, replay, and multi-turn continuation come for free.
- **Self-healing by default.** A tool that raises becomes an observation the model can recover from, not a crash. Invalid arguments get a targeted hint. A stuck loop gets a nudge.
- **Skills that stay out of the way.** Drop a `SKILL.md` folder in and the model sees only its name and description until it decides to load it. A large skill library costs almost nothing until it is used.

## What it looks like

Here is a complete, working agent:

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

The `@tool` decorator reads your function signature and docstring and builds the JSON Schema the model sees. The loop validates every call the model makes against that schema, executes tool calls concurrently, and feeds errors back as observations the model can act on.

## What is in 0.1.0

The first release covers the core framework plus a production-hardening pass:

- The async ReAct loop with blocking and streaming `run()`.
- A provider-neutral model layer and an OpenAI-compatible adapter with retries.
- Typed memory with JSON persistence and load validation.
- Streaming events with a ready-made `print_events` renderer.
- Progressive-disclosure skills with a built-in `load_skill` tool.
- Timeouts, graceful interruption, error redaction, and a `context_manager` hook for long runs.

The full list is in the [changelog](/changelog).

## Honest limitations

agentling is deliberately small, and the boundaries are documented rather than hidden. Schema validation covers a practical subset of JSON Schema, not the full spec. There is no built-in tracing backend; the event stream and step callbacks are the hooks. Tools run as trusted code in your process, so there is no sandboxing. And long runs can outgrow the context window unless you supply a `context_manager`.

If those constraints fit your project, I think you will enjoy how little there is between you and the loop.

## Getting started

```bash
pip install agentling
```

The [quickstart](/docs/getting-started/quickstart) takes you from an empty file to a streaming agent in a few minutes. The repository ships offline examples that need no API key, so you can watch failure recovery, persistence, and the full event stream before you spend a single token.

agentling is MIT licensed and open to contributions. If you build something with it, or you hit a rough edge, open an issue on [GitHub](https://github.com/folathecoder/agentling). This is version 0.1.0 of something I want to keep small, sharp, and readable all the way to 1.0.
