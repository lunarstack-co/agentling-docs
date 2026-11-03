---
title: Add skills
slug: skills
description: Give the agent instructions it loads only when a task needs them.
order: 4
metaTitle: "Add skills the agent loads on demand"
metaDescription: "Write a SKILL.md, pass it to an Agentling agent, and watch the model load the full instructions only when a task calls for them."
---

By the end of this chapter your agent will have a skill: a set of instructions it sees only by name until a task needs it, and then loads in full.

**You need:** the program from [Keep memory and resume](/docs/tutorial/memory-and-resume).

Instructions cost tokens on every model call. A skill keeps them out of the prompt until they're useful: the model sees each skill's name and one-line description, and calls a built-in `load_skill` tool when it decides it needs the rest. This is sometimes called progressive disclosure, which means the details are shown only when asked for.

## 1. Write a skill

A skill is a folder holding a `SKILL.md` file: YAML frontmatter with a `name` and a `description`, then the instructions in Markdown.

```markdown
---
name: show-working
description: Show each calculation step before giving an arithmetic answer.
---

# Show your working

For any arithmetic question:

1. Call one tool per operation.
2. List each call and its result, one per line.
3. Give the answer last, on its own line.
```

`Skill.from_path` reads the folder. The tutorial writes the folder to a temporary directory so each program stays one file; in your project it sits next to your code.

```python
import tempfile
from pathlib import Path

from agentling import Skill

SKILL_MD = """---
name: show-working
description: Show each calculation step before giving an arithmetic answer.
---

# Show your working

For any arithmetic question:

1. Call one tool per operation.
2. List each call and its result, one per line.
3. Give the answer last, on its own line.
"""

with tempfile.TemporaryDirectory() as tmp:
    folder = Path(tmp) / "show-working"
    folder.mkdir()
    (folder / "SKILL.md").write_text(SKILL_MD)

    skill = Skill.from_path(folder)
    print(skill.name)
    print(skill.description)
    print(skill.instructions.splitlines()[0])
```

```text
show-working
Show each calculation step before giving an arithmetic answer.
# Show your working
```

## 2. Give the agent the skill

Pass skill folders, or `Skill` objects, to `Agent(skills=...)`. These steps build the `Skill` in code to stay short; `path` is the folder its instructions can refer to. Only the catalog goes into the system prompt, and a `load_skill` tool joins the tools the model can call.

```python
import asyncio
from pathlib import Path

from agentling import Agent, ChatMessage, Skill
from agentling.testing import ScriptedModel

skill = Skill(
    name="show-working",
    description="Show each calculation step before giving an arithmetic answer.",
    instructions="List each tool call and its result, then the answer.",
    path=Path("."),
)

model = ScriptedModel([ChatMessage("assistant", "Hello.")])


async def main() -> None:
    await Agent(model=model, skills=[skill]).run("Hi")
    system_prompt = model.calls[0][0].content
    print(system_prompt.split("\n\n")[-1])
    print([tool.name for tool in model.tools[0]])


asyncio.run(main())
```

```text
You can load skills: focused instruction sets for particular kinds of task. When the task matches one, call load_skill(name) to load its full instructions and any tools it provides before continuing. Available skills:
- show-working: Show each calculation step before giving an arithmetic answer.
['final_answer', 'load_skill']
```

The instructions themselves aren't in the prompt. You can name your own tool `load_skill` only on an agent without skills.

## 3. Watch the model load it

When a task matches a skill, the model calls `load_skill` with the skill's name, and the tool's result is the full instructions. From the next turn on, the model has them in its conversation.

```python
import asyncio
from pathlib import Path

from agentling import Agent, ChatMessage, Skill, ToolCall, ToolResultEvent
from agentling.testing import ScriptedModel

skill = Skill(
    name="show-working",
    description="Show each calculation step before giving an arithmetic answer.",
    instructions="List each tool call and its result, then the answer.",
    path=Path("."),
)

model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "load_skill", {"name": "show-working"})]),
        ChatMessage("assistant", "No tools needed: 2 + 2 = 4."),
    ]
)


async def main() -> None:
    agent = Agent(model=model, skills=[skill])
    async for event in agent.run("What is 2 + 2?", stream=True):
        if isinstance(event, ToolResultEvent):
            print(f"{event.result.name}: {event.result.content}")


asyncio.run(main())
```

```text
load_skill: List each tool call and its result, then the answer.
```

A skill can also list tools in its frontmatter, as `tools: [my_package.module:my_tool]`. They're imported and added to the session when the skill loads. Importing runs that module's code, so load skills only from sources you trust, as you would any Python import; [Security and trust](/docs/concepts/security-and-trust) covers this.

## The complete program

The program from the last chapter with the `show-working` skill. The model loads the skill, then follows it. Saving and reloading the session is left out to keep the focus on the skill; add it back exactly as before.

```python title="skills_agent.py"
import asyncio
import tempfile
from pathlib import Path

from agentling import (
    Agent,
    ChatMessage,
    Event,
    FinalEvent,
    TextDelta,
    ToolCall,
    ToolCallEvent,
    ToolResultEvent,
    tool,
)
from agentling.testing import ScriptedModel

SKILL_MD = """---
name: show-working
description: Show each calculation step before giving an arithmetic answer.
---

# Show your working

For any arithmetic question:

1. Call one tool per operation.
2. List each call and its result, one per line.
3. Give the answer last, on its own line.
"""


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a * b


@tool
def divide(a: float, b: float) -> float:
    """Divide a by b.

    Args:
        a: The number to divide.
        b: The number to divide by.
    """
    return a / b


def build_model() -> ScriptedModel:
    return ScriptedModel(
        [
            ChatMessage(
                "assistant", tool_calls=[ToolCall("call_1", "load_skill", {"name": "show-working"})]
            ),
            ChatMessage("assistant", tool_calls=[ToolCall("call_2", "add", {"a": 19, "b": 23})]),
            ChatMessage("assistant", tool_calls=[ToolCall("call_3", "multiply", {"a": 42, "b": 2})]),
            ChatMessage("assistant", "add(19, 23) = 42\nmultiply(42, 2) = 84\nAnswer: 84"),
        ]
    )


def render(event: Event) -> None:
    match event:
        case TextDelta(text=text):
            print(text)
        case ToolCallEvent(tool_call=call):
            print(f"  -> {call.name}({call.arguments})")
        case ToolResultEvent(result=result):
            mark = "error" if result.is_error else "ok"
            first_line = result.content.splitlines()[0]
            print(f"  <- {result.name} [{mark}]: {first_line}")
        case FinalEvent():
            pass


def write_skill(root: Path) -> Path:
    folder = root / "show-working"
    folder.mkdir()
    (folder / "SKILL.md").write_text(SKILL_MD)
    return folder


async def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        agent = Agent(
            model=build_model(),
            tools=[add, multiply, divide],
            skills=[write_skill(Path(tmp))],
        )
        session = agent.start()
        async for event in session.run("What is (19 + 23) * 2?", stream=True):
            render(event)


if __name__ == "__main__":
    asyncio.run(main())
```

It prints:

```text
  -> load_skill({'name': 'show-working'})
  <- load_skill [ok]: # Show your working
  -> add({'a': 19, 'b': 23})
  <- add [ok]: 42
  -> multiply({'a': 42, 'b': 2})
  <- multiply [ok]: 84
add(19, 23) = 42
multiply(42, 2) = 84
Answer: 84
```

## What you built

An agent that keeps its prompt small and pulls in detailed instructions only for the tasks that need them. So far every chapter has run on a scripted model. Next, you'll swap in a real one: [Connect a real model](/docs/tutorial/connect-a-model).
