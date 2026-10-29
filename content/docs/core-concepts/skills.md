---
title: Skills
slug: skills
description: Instruction folders the model loads on demand, catalog first.
order: 5
metaTitle: "Skills: instruction folders loaded on demand"
metaDescription: "Put a SKILL.md folder in your project. The model sees its name and summary in a catalog and loads the full instructions only when it decides it needs them."
---

A skill is a folder containing a `SKILL.md` file: YAML frontmatter followed by a markdown body of instructions. Skills let you package expertise, and progressive disclosure keeps them cheap until the model actually needs them.

## The SKILL.md format

```markdown
---
name: code-reviewer
description: Review a code change for bugs, security issues, and style problems.
---

# Code Reviewer

You are reviewing a code change. Work through it methodically and report only
findings you are confident about...
```

## Progressive disclosure

When you pass skills to an agent, only their names and descriptions are added to the system prompt as a catalog. The full instruction body stays out of context until the model calls the built-in `load_skill(name)` tool, at which point the body is returned as an observation and any tools the skill declares are registered. This keeps the base prompt small even with a large library of skills installed: the cost of a skill is only paid once the model decides to use it.

```python
import asyncio

from agentling import Agent, OpenAIModel, tool


@tool
def read_file(path: str) -> str:
    """Read a UTF-8 text file and return its contents.

    Args:
        path: Path to the file to read.
    """
    with open(path, encoding="utf-8") as handle:
        return handle.read()


async def main() -> None:
    agent = Agent(
        model=OpenAIModel("gpt-4o-mini"),
        tools=[read_file],
        skills=["examples/skills/code-reviewer"],
    )
    print(await agent.run("Review the code in src/agentling/agent.py"))


asyncio.run(main())
```

## Skills that bring their own tools

A skill can declare Python entry points in its frontmatter. They are imported and registered when the skill loads:

```markdown
---
name: linting
description: Lint Python files and report issues.
tools:
  - my_package.lint_tools:run_ruff
---
```

Each entry point is a `"module.path:attribute"` string that must resolve to a `Tool`, a function decorated with `@tool`. Because the loop reads the live tool set fresh on every step, tools registered during a load are available on the very next turn.

You can pass skills as folder paths, strings or `Path` objects, or as pre-built `Skill` objects created with `Skill.from_path`.

## Security

> [!CAUTION]
> A skill's `tools:` entry point is imported with `importlib`, which runs that module's top-level code. Load skills only from sources you trust, exactly as you would a Python import.

The [Tools](/docs/core-concepts/tools) page covers what registered tools can do, and the project's SECURITY.md documents the full trust model.
