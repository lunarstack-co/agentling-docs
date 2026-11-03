---
title: Contributing
slug: contributing
description: How to set up a development environment, run the checks, and contribute to Agentling and these docs.
metaTitle: "Contributing: setup, checks, pull requests"
metaDescription: "Set up Agentling or these docs, run the checks CI runs, write examples that are tested, and open a pull request."
---

Agentling stays small on purpose, so a focused contribution matters more than a big one. There are two repositories: [agentling](https://github.com/lunarstack-co/agentling), the package, and [agentling-docs](https://github.com/lunarstack-co/agentling-docs), this site.

## Agentling

Agentling uses [uv](https://docs.astral.sh/uv/) and Python 3.11 or newer.

```bash
git clone https://github.com/lunarstack-co/agentling
cd agentling
uv sync
```

CI runs these, and all must pass:

```bash
uv run ruff check src tests examples
uv run ruff format --check src tests examples
uv run mypy src tests examples
uv run pytest
uv build
```

The package also type-checks under `uv run mypy --strict src`; keep it that way. The test suite runs offline in a few seconds and executes the README's Python blocks, so a README change can fail a test. The repository's [CONTRIBUTING.md](https://github.com/lunarstack-co/agentling/blob/v0.2.0/CONTRIBUTING.md) covers branches, commit messages and how to add a tool, an example or a model adapter.

Some guidelines:

- Keep the loop small and readable. Prefer clarity over cleverness.
- Test new behaviour, including how it fails.
- Type everything.
- Avoid new runtime dependencies. The package depends on `pyyaml` only.

## These docs

The site is a Next.js app. Every page and changelog entry is a Markdown file under `content/`.

```bash
git clone https://github.com/lunarstack-co/agentling-docs
cd agentling-docs
npm ci
npm run dev
```

The Node checks:

```bash
npm run validate
npm run lint
npx tsc --noEmit
npm run build
```

### Examples are tested

Every `python` code block under `content/` runs in CI against Agentling, each in its own Python process from the repository root, with top-level `await` allowed. Blocks that import `examples.providers` need the Agentling source: point `AGENTLING_SRC` at a checkout, or clone it next to this repository as `../agentling`.

```bash
uv sync
AGENTLING_SRC=../agentling uv run pytest
```

A block that can't run, because it needs an API key or is a fragment of a longer program, starts with a marker and a reason:

```text
# not executed: needs an OpenAI API key
```

A marker without a reason fails the test. Keep markers rare; most examples can run on `ScriptedModel` or a recorded fixture in `tests/fixtures/`.

### What the validator checks

`npm run validate` checks frontmatter, slugs and internal links, and these writing rules:

- No em or en dashes.
- No `framework`. Agentling is an agent engine; only the migration page may mention the old word.
- No filler words such as `seamless`, `robust`, `leverage` or `in order to`. The full list is in `scripts/validate-content.mjs`.
- Headings in sentence case. Product names and code in backticks are fine.
- Links into the agentling repository point at a release tag, such as `blob/v0.2.0/`, never at `main`, so a page matches the version it documents.

## Reporting bugs

Open a [GitHub issue](https://github.com/lunarstack-co/agentling/issues) with the smallest script that reproduces the problem, your Python version and the Agentling version. For a mistake in the docs, open an issue or a pull request on [agentling-docs](https://github.com/lunarstack-co/agentling-docs).

## Reporting vulnerabilities

Report suspected vulnerabilities privately by emailing me@folarin.dev. Don't open a public issue for a security report. Receipt is acknowledged within a few days, and you'll be kept posted on the fix. The trust model is in [SECURITY.md](https://github.com/lunarstack-co/agentling/blob/v0.2.0/SECURITY.md) and [Security and trust](/docs/concepts/security-and-trust).

## License

Agentling is [MIT licensed](https://github.com/lunarstack-co/agentling/blob/v0.2.0/LICENSE). By contributing, you agree that your contributions are licensed under the same terms.
