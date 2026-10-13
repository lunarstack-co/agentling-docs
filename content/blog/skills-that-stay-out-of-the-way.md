---
title: Skills that stay out of the way
slug: skills-that-stay-out-of-the-way
excerpt: Progressive disclosure lets you install a large library of agent skills while paying almost nothing in context until the model actually needs one. Here is how agentling implements it.
publishDate: 2026-07-08T14:00:00Z
authorName: Folarin Akinloye
tags:
  - engineering
  - skills
featured: false
readingMinutes: 5
---

There is a tension at the heart of giving agents instructions. The more expertise you write down for your agent, the more context you burn on every single run, whether that expertise is relevant or not. agentling resolves this with progressive disclosure, an idea borrowed from Claude's skill format, and I think it is one of the most useful patterns in the framework.

## A skill is a folder

In agentling, a skill is a folder containing a `SKILL.md` file: YAML frontmatter followed by a markdown body of instructions.

```markdown
---
name: code-reviewer
description: Review a code change for bugs, security issues, and style problems.
---

# Code Reviewer

You are reviewing a code change. Work through it methodically and report only
findings you are confident about...
```

That is the entire format. No classes to subclass, no registration step, no build process. If you can write markdown, you can write a skill.

## The catalog costs almost nothing

Here is the key move. When you pass skills to an agent, the full instruction bodies do not go into the system prompt. Only a catalog of names and descriptions does, one line per skill:

```
code-reviewer: Review a code change for bugs, security issues, and style problems.
linting: Lint Python files and report issues.
```

The agent also registers a single built-in tool, `load_skill`. When the model decides a skill is relevant, it calls `load_skill(name)`, and the skill's full instruction body comes back as a tool observation. From that moment the expertise is in context, but not a token sooner.

With ten skills installed, your base prompt grows by ten lines, not ten documents. The cost of a skill is only paid when the model actually chooses to use it.

## Skills can bring their own tools

A skill can declare Python entry points in its frontmatter:

```markdown
---
name: linting
description: Lint Python files and report issues.
tools:
  - my_package.lint_tools:run_ruff
---
```

Each entry is a `"module.path:attribute"` string that must resolve to a function decorated with `@tool`. When the skill loads, those tools are imported and registered on the session. Because the loop reads the live tool set fresh on every step, the new tools are available on the very next turn. Instructions and capabilities arrive together, on demand.

One important note: an entry point is imported with `importlib`, which runs that module's top-level code. Load skills only from sources you trust, exactly as you would treat a Python import. The [security policy](https://github.com/lunarstack-co/agentling/blob/main/SECURITY.md) spells out the full trust model.

## Why this beats prompt stuffing

I keep coming back to three properties of this design:

- **Relevance is decided by the model, at run time.** You do not have to predict which expertise a task needs. The model reads the catalog and pulls what it judges useful.
- **Skill libraries scale.** The marginal cost of installing one more skill is one catalog line. Teams can accumulate skills the way they accumulate internal docs.
- **Skills are inspectable.** A skill is a text file in your repository. You can review it, diff it, and version it like any other code.

The [skills documentation](/docs/core-concepts/skills) covers the format in full, including how to pass pre-built `Skill` objects and how loaded tools interact with [sessions](/docs/guides/sessions-and-concurrency). If you build a skill you are proud of, I would genuinely like to see it.
