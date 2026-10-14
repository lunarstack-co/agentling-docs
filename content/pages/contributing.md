---
title: Contributing
slug: contributing
description: How to set up a development environment, run the checks, and contribute to agentling.
metaTitle: "Contributing: setup, checks, pull requests"
metaDescription: "Set up a dev environment with uv, run the test, lint, format, and type checks that CI runs, and open a pull request against the agentling repository."
---

Thanks for your interest in improving agentling. The framework stays deliberately small, so thoughtful contributions matter more than big ones.

## Development setup

agentling uses [uv](https://docs.astral.sh/uv/) for environment and dependency management:

```bash
git clone https://github.com/lunarstack-co/agentling
cd agentling
uv sync   # create the environment and install all dependencies
```

## The checks

These all run in CI and must pass. Run them locally before opening a pull request:

```bash
uv run pytest                         # tests
uv run ruff check src tests           # lint
uv run ruff format --check src tests  # formatting (run `ruff format` to fix)
uv run mypy src tests                 # type-check
uv build                              # the package builds
```

## Guidelines

- Keep the framework small and readable; prefer clarity over cleverness.
- Add tests for new behavior, including the failure paths.
- Type everything; the codebase is checked with mypy.
- Match the surrounding style; `ruff format` is the source of truth.
- Avoid new runtime dependencies unless they clearly earn their place.

## Good first contributions

- Improve an example, or add one that shows a pattern the current set misses.
- Sharpen a docstring or a documentation page that confused you.
- Add a test for an edge case you hit in real usage.
- Report friction honestly: a well-written issue about a rough edge is a contribution.

## Reporting bugs

Open a [GitHub issue](https://github.com/lunarstack-co/agentling/issues) for bugs. Include the smallest script that reproduces the problem, your Python version, and the agentling version.

## Reporting vulnerabilities

Please report suspected vulnerabilities privately by emailing me@folarin.dev. Do not open a public issue for a security report. Receipt is acknowledged within a few days, and you will be kept posted on the fix. The full trust model is documented in [SECURITY.md](https://github.com/lunarstack-co/agentling/blob/main/SECURITY.md).

## Contributing to these docs

This documentation site is open source too. Every page, blog post, and changelog entry is a markdown file in the repository, so fixing a typo or improving an explanation is a pull request against [agentling-docs](https://github.com/lunarstack-co/agentling-docs). Merged changes go live on the next deploy.

## License

agentling is [MIT licensed](https://github.com/lunarstack-co/agentling/blob/main/LICENSE). By contributing, you agree that your contributions will be licensed under the same terms.
