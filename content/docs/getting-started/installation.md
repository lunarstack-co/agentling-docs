---
title: Install
slug: installation
description: Install Agentling with pip or uv, check it works, and find the 0.1.1 docs.
order: 2
metaTitle: "Install Agentling with pip or uv"
metaDescription: "Install Agentling on Python 3.11 or newer with pip or uv. One dependency, no API key needed for the tutorial, and httpx for the reference adapters."
---

Agentling needs Python 3.11 or newer. Its only dependency is `pyyaml`, which reads skill files.

## Install the package

With pip:

```bash
pip install agentling
```

With [uv](https://docs.astral.sh/uv/):

```bash
uv add agentling
```

## Check it works

```python
import agentling

print(agentling.__version__)
```

```text
0.2.0
```

## What you don't need yet

The first chapters of the [tutorial](/docs/getting-started/quickstart) run on `ScriptedModel`, a model that replays a script, so you need no API key and no network.

When you [connect a real model](/docs/tutorial/connect-a-model), you copy a reference adapter into your project. The reference adapters talk HTTP with `httpx`, so install it then:

```bash
pip install httpx
```

Agentling is async. Call it from async code, or wrap your entry point in `asyncio.run`, as the tutorial's programs do. Some short examples, including those on the reference pages, use `await` at the top level to stay brief: run them with `python -m asyncio`, or put them inside an `async def main()`.

## Using 0.1.1?

Version 0.2.0 removed the bundled OpenAI model and changed several APIs, so this site no longer matches 0.1.1. The 0.1.1 docs are in the [docs repository at the `v0.1.1` tag](https://github.com/lunarstack-co/agentling-docs/tree/v0.1.1/content/docs), and the [changelog](/changelog) lists what each release changed. To move your code to 0.2.0, follow [Migrate from 0.1](/docs/how-to/migrate-from-0-1).
