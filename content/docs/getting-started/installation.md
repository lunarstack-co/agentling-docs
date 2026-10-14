---
title: Installation
slug: installation
description: Install agentling with pip or uv and configure your provider key.
order: 2
metaTitle: "Install Agentling with pip or uv"
metaDescription: "Install agentling with pip or uv on Python 3.11 or newer, set an API key for OpenAI or any compatible provider, and check the install in one command."
---

Install agentling from PyPI:

```bash
pip install agentling
```

Or with [uv](https://docs.astral.sh/uv/):

```bash
uv add agentling
```

## Requirements

- Python 3.11 or newer.
- The only runtime dependencies are `openai` (the client used by the built-in provider adapter) and `pyyaml` (for skill frontmatter).

## Configure a provider key

The built-in `OpenAIModel` adapter reads your key from the environment:

```bash
export OPENAI_API_KEY="sk-..."
```

You can point the same adapter at any OpenAI-compatible endpoint (a local server, a gateway, or another vendor's compatible API) by passing `base_url`. See [Using other providers](/docs/guides/other-providers).

## Verify the install

Run a quick import check:

```bash
python -c "import agentling; print(agentling.__name__)"
```

If that prints `agentling`, you are ready to build your first agent.

## Try the examples

The repository ships runnable examples. The offline ones need no API key at all:

```bash
git clone https://github.com/lunarstack-co/agentling
cd agentling
uv sync

uv run python examples/cli_failure_recovery.py   # recover from tool errors
uv run python examples/cli_memory_chat.py        # persist and continue a session
uv run python examples/cli_advanced_observer.py  # watch every event type
```

The rest use an OpenAI-compatible model. Set `OPENAI_API_KEY`, and optionally `AGENTLING_EXAMPLE_MODEL`:

```bash
uv run python examples/cli_math_tutor.py               # smallest useful agent
uv run python examples/cli_repo_assistant.py "..."     # streaming plus safe file tools
uv run python examples/cli_notes_agent.py              # file-backed notes tools
```

## Next steps

- [Quickstart](/docs/getting-started/quickstart): build and run your first agent.
- [Tools](/docs/core-concepts/tools): how functions become schema-validated tools.
