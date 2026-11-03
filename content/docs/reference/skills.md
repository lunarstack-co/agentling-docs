---
title: Skills
slug: skills
description: The Skill type, the SKILL.md format, and the built-in load_skill tool.
order: 7
metaTitle: "Skills reference: Skill and SKILL.md"
metaDescription: "The Skill dataclass, the SKILL.md frontmatter and body, tool entry points, and what the built-in load_skill tool returns and registers."
---

`agentling.skills` loads instructions the model reads only when it needs them. Import `Skill` from `agentling`. For adding a skill to an agent step by step, see [Add skills](/docs/tutorial/skills).

## SKILL.md

A skill is a folder containing a `SKILL.md` file: YAML frontmatter between two lines that are exactly `---`, then a Markdown body of instructions.

```markdown
---
name: code-reviewer
description: Review a code change for bugs, security issues, and style problems.
tools:
  - my_package.lint_tools:run_ruff
---

You are reviewing a code change...
```

| Key | Required | Meaning |
| --- | --- | --- |
| `name` | yes | The name the model passes to `load_skill`. |
| `description` | yes | One line the model sees in the catalog. |
| `tools` | no | Entry points, `"package.module:attribute"`, each resolving to a `Tool`. |

A file that doesn't start with `---` is all body. Only the first closing `---` ends the frontmatter, so a horizontal rule in the body is left alone. [`examples/skills/code-reviewer`](https://github.com/lunarstack-co/agentling/tree/v0.2.0/examples/skills/code-reviewer) is a complete skill.

## Skill

`Skill(name: str, description: str, instructions: str, path: Path, tools: list[str] = [])`

| Field | Meaning |
| --- | --- |
| `name`, `description` | From the frontmatter. |
| `instructions` | The body, stripped of surrounding whitespace. |
| `path` | The skill's folder, so the instructions can refer to files beside `SKILL.md`. |
| `tools` | The entry points from the frontmatter. |

| Method | Meaning |
| --- | --- |
| `Skill.from_path(path: str \| Path) -> Skill` | Class method. Reads `path/SKILL.md`. |
| `load_tools() -> list[Tool]` | Imports each entry point and returns the `Tool`s. |

**Raises.** `from_path` raises `OSError` when `SKILL.md` can't be read, `yaml.YAMLError` when the YAML doesn't parse, and `ValueError` when the frontmatter isn't a mapping, misses `name` or `description`, isn't closed, or has a `tools` value that isn't a list of strings. `load_tools` raises `ValueError` for an entry point without a colon, `TypeError` when one resolves to something other than a `Tool`, and the usual import errors when its module can't load. `SkillLoadError` exists but isn't raised yet.

Importing a skill's tools runs that module's code. Load skills only from sources you trust; see [Security and trust](/docs/concepts/security-and-trust).

## The catalog and load_skill

`Agent(skills=[...])` takes `Skill` objects or folder paths. When there are skills, the agent appends a catalog to the system prompt, one `- name: description` line per skill, and gives every session a built-in tool:

| Tool | Meaning |
| --- | --- |
| `load_skill(name: str)` | Returns the skill's instructions as the tool result and registers its tools on the session, so they're offered from the next turn. When the skill brings tools, the result ends with `Tools now available: ...`. |

An unknown name, or a skill tool whose name is already taken by a different tool, comes back to the model as an error result. `load_skill` is reserved while skills are configured: a tool of your own can't use the name, and `Agent()` raises `ValueError` if one does.

## Example

```python
import tempfile
from pathlib import Path

from agentling import Agent, ChatMessage, Skill, ToolCall
from agentling.testing import ScriptedModel

folder = Path(tempfile.mkdtemp()) / "haiku"
folder.mkdir()
(folder / "SKILL.md").write_text(
    "---\nname: haiku\ndescription: Answer in a haiku.\n---\n\nUse 5, 7 and 5 syllables.\n"
)

skill = Skill.from_path(folder)
print(skill.name, "|", skill.instructions)

model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("c1", "load_skill", {"name": "haiku"})]),
        ChatMessage("assistant", "Quiet loop turns on"),
    ]
)
agent = Agent(model=model, skills=[skill])
session = agent.start()
print(await session.run("Describe the loop."))
print(session.memory.steps[1].tool_results[0].content)
print(agent.instructions.splitlines()[-1])

try:
    Skill("x", "y", "", folder, tools=["no_colon"]).load_tools()
except ValueError as exc:
    print(exc)
```

Output:

```text
haiku | Use 5, 7 and 5 syllables.
Quiet loop turns on
Use 5, 7 and 5 syllables.
- haiku: Answer in a haiku.
Tool entry point 'no_colon' must be 'module.path:attribute'.
```
