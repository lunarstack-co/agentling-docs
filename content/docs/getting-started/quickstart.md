---
title: Your first agent
slug: quickstart
description: Build and run an agent with one tool, with no API key and no network.
order: 3
metaTitle: "Your first Agentling agent, no API key"
metaDescription: "Write a tool, script a model with ScriptedModel, and run your first Agentling agent. The program runs offline and is the start of the tutorial."
---

By the end of this page you'll have a program that runs an agent with one tool and prints its answer, with no API key and no network.

**You need:** Agentling installed, as in [Install](/docs/getting-started/installation).

The tutorial uses `ScriptedModel` in place of a real model. It replays the replies you give it, one per model turn, so every example runs the same way every time. You'll swap in a real model in [Connect a real model](/docs/tutorial/connect-a-model), and nothing else in your code changes.

## 1. Write a tool

A tool is a Python function with `@tool` on it. The function name becomes the tool's name, the docstring's summary (the text before `Args:`) becomes its description, and the type hints plus the `Args:` section become the JSON Schema the model reads.

```python
import json

from agentling import tool


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


print(add.name)
print(add.description)
print(json.dumps(add.parameters, indent=2))
```

```text
add
Add two integers.
{
  "type": "object",
  "properties": {
    "a": {
      "type": "integer",
      "description": "The first number."
    },
    "b": {
      "type": "integer",
      "description": "The second number."
    }
  },
  "required": [
    "a",
    "b"
  ],
  "additionalProperties": false
}
```

Parameters without a default are required. Agentling checks the model's arguments against this schema before your function runs.

## 2. Script the model

A model in Agentling is any object with a `stream(messages, tools)` method that yields `Delta` objects: small pieces of a reply. `ScriptedModel` takes a list of whole replies and streams the next one each time it's called. This script asks for the `add` tool first, then answers.

```python
import asyncio

from agentling import ChatMessage, ToolCall
from agentling.testing import ScriptedModel

model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
    ]
)


async def main() -> None:
    async for delta in model.stream([ChatMessage("user", "What is 19 + 23?")]):
        print(delta)


asyncio.run(main())
```

```text
Delta(content=None, tool_calls=[ToolCallDelta(index=0, id='call_1', name='add', arguments='{"a": 19, "b": 23}')], usage=None, reasoning=None, finish_reason=None, provider_data=None)
```

The first turn is a tool call with no text. You won't usually read deltas yourself; the agent does.

## 3. Run the agent

`Agent` takes the model and the tools. `agent.run(task)` runs the loop until the model answers and returns the answer as a string.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[add])
    print(await agent.run("What is 19 + 23?"))


asyncio.run(main())
```

```text
19 + 23 = 42.
```

The loop called the model, saw a tool call, ran `add(a=19, b=23)`, sent `42` back as the tool's result, and called the model again. The second reply had no tool calls, so it's the answer.

## 4. See what the model was sent

`ScriptedModel` records every call in `model.calls`, which is how you'll check an agent's behaviour in tests later. Each call is the full list of messages the model received.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
    ]
)


async def main() -> None:
    await Agent(model=model, tools=[add]).run("What is 19 + 23?")
    for number, messages in enumerate(model.calls, start=1):
        print(f"call {number}: {[message.role for message in messages]}")
    print("tool result sent back:", model.calls[1][-1].content)


asyncio.run(main())
```

```text
call 1: ['system', 'user']
call 2: ['system', 'user', 'assistant', 'tool']
tool result sent back: 42
```

The system message holds the agent's instructions. You can replace them with `Agent(instructions=...)`.

## The complete program

```python title="first_agent.py"
import asyncio

from agentling import Agent, ChatMessage, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


def build_model() -> ScriptedModel:
    return ScriptedModel(
        [
            ChatMessage("assistant", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
            ChatMessage("assistant", "19 + 23 = 42."),
        ]
    )


async def main() -> None:
    agent = Agent(model=build_model(), tools=[add])
    print(await agent.run("What is 19 + 23?"))


if __name__ == "__main__":
    asyncio.run(main())
```

Run it with `python first_agent.py`. It prints `19 + 23 = 42.`

## What you built

An agent with one tool, driven by a scripted model, that runs the full loop: model turn, tool call, tool result, answer. Next, you'll watch that loop as it happens: [Stream events](/docs/tutorial/stream-events).
