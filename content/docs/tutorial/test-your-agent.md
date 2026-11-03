---
title: Test your agent
slug: test-your-agent
description: Test tools, the agent's behaviour and the model adapter, offline and repeatably.
order: 6
metaTitle: "Test your agent offline with ScriptedModel"
metaDescription: "Fast, repeatable tests for an Agentling agent: call tools directly, script the model with ScriptedModel, assert what it was sent, and check the adapter."
---

By the end of this chapter you'll have a test file that checks your tools, your agent's behaviour, its failure handling and its model adapter, and runs in a fraction of a second with no network.

**You need:** the program from [Connect a real model](/docs/tutorial/connect-a-model), and `pytest` with `pytest-asyncio` (`pip install pytest pytest-asyncio`).

A real model answers differently each time, which makes it a poor thing to test against. Test the parts you own instead: the tools, the way the agent uses them, and the adapter. `ScriptedModel` plays the model, so each test controls exactly what the model "says" and can then check what the agent did with it.

To test the agent your app really uses, build it in one function that takes the model as an argument. Your app passes the real adapter; your tests pass a `ScriptedModel`.

## 1. Test the tools directly

A tool is an object with an async `call` method that checks the arguments against the schema, then runs your function. Call it the way the loop does.

```python
import asyncio

from agentling import ToolCallError, tool


@tool
def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.
    """
    return a + b


async def test_add() -> None:
    assert await add.call({"a": 19, "b": 23}) == 42
    try:
        await add.call({"a": 19})
    except ToolCallError as error:
        print(error)
    else:
        raise AssertionError("expected a ToolCallError")


asyncio.run(test_add())
```

```text
Tool 'add' is missing required argument(s): b
```

## 2. Script the model and check what the agent did

Give the agent a `ScriptedModel`, run it, then assert on the answer and on `model.calls`, the messages the model was sent each turn. That's where you check that a tool's result reached the model.

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


async def test_answer_uses_the_tool_result() -> None:
    model = ScriptedModel(
        [
            ChatMessage("assistant", tool_calls=[ToolCall("c1", "add", {"a": 19, "b": 23})]),
            ChatMessage("assistant", "42"),
        ]
    )

    answer = await Agent(model=model, tools=[add]).run("What is 19 + 23?")

    assert answer == "42"
    assert model.calls[1][-1].role == "tool"
    assert model.calls[1][-1].content == "42"
    assert [definition.name for definition in model.tools[0]] == ["add", "final_answer"]
    print("passed")


asyncio.run(test_answer_uses_the_tool_result())
```

```text
passed
```

`model.tools` holds the tool definitions sent on each call, so you can also check that the model was offered the tools you expected.

## 3. Test the failure paths

Script the failures too: a tool call that will raise, or a model error in place of a reply. A `ScriptedModel` turn can be an exception, which the model raises instead of answering. A scripted rate limit with `retry_after=0` is retried at once, so the test doesn't wait.

```python
import asyncio

from agentling import (
    Agent,
    ChatMessage,
    ModelRateLimitError,
    RetryPolicy,
    ToolCall,
    tool,
)
from agentling.testing import ScriptedModel


@tool
def divide(a: float, b: float) -> float:
    """Divide a by b.

    Args:
        a: The number to divide.
        b: The number to divide by.
    """
    return a / b


async def test_failures() -> None:
    model = ScriptedModel(
        [
            ModelRateLimitError("busy", retry_after=0),
            ChatMessage("assistant", tool_calls=[ToolCall("c1", "divide", {"a": 1, "b": 0})]),
            ChatMessage("assistant", "Undefined."),
        ]
    )
    agent = Agent(model=model, tools=[divide], retry=RetryPolicy(base_delay=0, jitter=0))

    assert await agent.run("What is 1 / 0?") == "Undefined."
    assert len(model.calls) == 3
    assert model.calls[2][-1].content.startswith("Error from 'divide': ZeroDivisionError")
    print("passed")


asyncio.run(test_failures())
```

```text
passed
```

Three calls: the one that hit the rate limit, the retry that asked for `divide`, and the turn that saw the error.

## 4. Check the adapter in the same suite

The `check_model` run from the last chapter belongs in your tests, so a change to the adapter that breaks the contract fails the build. It replays the recorded responses, so it is as fast and offline as the other tests. The final program below includes it.

## 5. Run the tests with pytest

Tell pytest-asyncio to run `async def` tests on its own by adding this to your `pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

Then run the file:

```bash
pytest -q test_agent.py
```

```text
......                                                                   [100%]
6 passed in 0.03s
```

## The complete program

`build_agent` is the agent from the earlier chapters, with the skill built in code. The file runs under pytest, and also on its own with `python test_agent.py`.

```python title="test_agent.py"
import asyncio
from pathlib import Path

from agentling import (
    Agent,
    ChatMessage,
    Model,
    ModelRateLimitError,
    RetryPolicy,
    Skill,
    ToolCall,
    ToolCallError,
    tool,
)
from agentling.testing import ScriptedModel, check_model
from examples.providers.openai_chat import OpenAIChatModel  # your copy of the adapter

SHOW_WORKING = Skill(
    name="show-working",
    description="Show each calculation step before giving an arithmetic answer.",
    instructions="List each tool call and its result, then the answer.",
    path=Path("."),
)


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


def build_agent(model: Model, retry: RetryPolicy = RetryPolicy()) -> Agent:
    """The app's agent. In your project this lives in its own module."""
    return Agent(
        model=model, tools=[add, multiply, divide], skills=[SHOW_WORKING], retry=retry
    )


def call(name: str, **arguments: object) -> ChatMessage:
    return ChatMessage("assistant", tool_calls=[ToolCall(f"call_{name}", name, arguments)])


async def test_tools_do_the_arithmetic() -> None:
    assert await add.call({"a": 19, "b": 23}) == 42
    assert await divide.call({"a": 84, "b": 4}) == 21.0
    try:
        await add.call({"a": 19})
    except ToolCallError as error:
        assert "missing required argument" in str(error)
    else:
        raise AssertionError("expected a ToolCallError")


async def test_answer_uses_the_tool_result() -> None:
    model = ScriptedModel([call("add", a=19, b=23), ChatMessage("assistant", "42")])

    answer = await build_agent(model).run("What is 19 + 23?")

    assert answer == "42"
    assert model.calls[1][-1].role == "tool"
    assert model.calls[1][-1].content == "42"


async def test_model_sees_the_tools_and_the_skill_catalog() -> None:
    model = ScriptedModel([ChatMessage("assistant", "Hi.")])

    await build_agent(model).run("Hello")

    names = [definition.name for definition in model.tools[0]]
    assert names == ["add", "multiply", "divide", "final_answer", "load_skill"]
    assert "- show-working:" in model.calls[0][0].content


async def test_division_by_zero_reaches_the_model_as_an_error() -> None:
    model = ScriptedModel([call("divide", a=1, b=0), ChatMessage("assistant", "Undefined.")])

    await build_agent(model).run("What is 1 / 0?")

    observation = model.calls[1][-1].content
    assert observation.startswith("Error from 'divide': ZeroDivisionError")


async def test_a_rate_limit_is_retried() -> None:
    model = ScriptedModel(
        [ModelRateLimitError("busy", retry_after=0), ChatMessage("assistant", "Done.")]
    )
    agent = build_agent(model, retry=RetryPolicy(base_delay=0, jitter=0))

    assert await agent.run("Say done.") == "Done."
    assert len(model.calls) == 2


async def test_the_adapter_keeps_the_contract() -> None:
    def build(transport):
        return OpenAIChatModel("gpt-4o-mini", api_key="unused", transport=transport)

    report = await check_model(build, recorded="tests/fixtures/openai_chat.jsonl")

    report.raise_for_failures()


async def run_all() -> None:
    tests = [value for name, value in globals().items() if name.startswith("test_")]
    for test in tests:
        await test()
        print(f"passed: {test.__name__}")


if __name__ == "__main__":
    asyncio.run(run_all())
```

Run on its own, it prints:

```text
passed: test_tools_do_the_arithmetic
passed: test_answer_uses_the_tool_result
passed: test_model_sees_the_tools_and_the_skill_catalog
passed: test_division_by_zero_reaches_the_model_as_an_error
passed: test_a_rate_limit_is_retried
passed: test_the_adapter_keeps_the_contract
```

## What you built

A test suite that pins down the agent's behaviour without a model: the tools, what the model is sent, how failures reach it, and the adapter's contract. In the last chapter you'll put the pieces together into a harness of your own: [Build a harness](/docs/tutorial/build-a-harness).
