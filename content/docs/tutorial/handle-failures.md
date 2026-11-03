---
title: Handle failures
slug: handle-failures
description: Tool errors, bad arguments, timeouts and model outages, and how the loop recovers from each.
order: 2
metaTitle: "Handle tool and model failures"
metaDescription: "See how Agentling turns tool errors, bad arguments and timeouts into results the model can act on, and retries failed model turns under a RetryPolicy."
---

By the end of this chapter your agent will survive a tool that crashes, a model that sends bad arguments, a slow tool and a model service that asks it to slow down, and you'll see each failure as it happens.

**You need:** the program from [Stream events](/docs/tutorial/stream-events).

Agentling sorts failures into two kinds. A failure inside a tool goes back to the model as that tool's result, so the model can try something else and the run carries on. A failure of the model itself (the service is down, the key is wrong) is retried when retrying can help, and raised to you when it can't.

## 1. A tool that raises

Add a `divide` tool and script the model to divide by zero. The exception doesn't reach your code. The loop catches it, and the `ToolResultEvent` carries it with `is_error` set and an `error_kind` saying what went wrong.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, ToolResultEvent, tool
from agentling.testing import ScriptedModel


@tool
def divide(a: float, b: float) -> float:
    """Divide a by b.

    Args:
        a: The number to divide.
        b: The number to divide by.
    """
    return a / b


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "divide", {"a": 1, "b": 0})]),
        ChatMessage("assistant", "You can't divide by zero."),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[divide])
    async for event in agent.run("What is 1 / 0?", stream=True):
        if isinstance(event, ToolResultEvent):
            result = event.result
            print(result.is_error, result.error_kind, result.content)
    print("model saw:", model.calls[1][-1].content)


asyncio.run(main())
```

```text
True execution ZeroDivisionError: division by zero
model saw: Error from 'divide': ZeroDivisionError: division by zero. Consider a different approach or tool.
```

The message the model sees ends with a hint chosen by the kind of error. For a failure while running, the hint suggests a different approach.

If a tool's exception messages might contain secrets, pass `Agent(redact_errors=True)`. The model then sees only the exception type, and the full error goes to the `agentling` logger.

## 2. Bad arguments and unknown tools

Models make mistakes in tool calls: a string where a number belongs, or a misspelt tool name. Agentling checks every call against the tool's schema before running it.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, ToolResultEvent, tool
from agentling.testing import ScriptedModel


@tool
def divide(a: float, b: float) -> float:
    """Divide a by b.

    Args:
        a: The number to divide.
        b: The number to divide by.
    """
    return a / b


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "divide", {"a": "one", "b": 2})]),
        ChatMessage("assistant", tool_calls=[ToolCall("call_2", "divde", {"a": 1, "b": 2})]),
        ChatMessage("assistant", tool_calls=[ToolCall("call_3", "divide", {"a": 1, "b": 2})]),
        ChatMessage("assistant", "1 / 2 = 0.5."),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[divide])
    async for event in agent.run("What is 1 / 2?", stream=True):
        if isinstance(event, ToolResultEvent):
            result = event.result
            print(f"[{result.error_kind or 'ok'}] {result.content}")
    print("model saw:", model.calls[1][-1].content)


asyncio.run(main())
```

```text
[validation] ToolCallError: Tool 'divide' argument 'a' expects number, got str
[unknown_tool] Unknown tool 'divde'. Available: ['divide', 'final_answer']
[ok] 0.5
model saw: Error from 'divide': ToolCallError: Tool 'divide' argument 'a' expects number, got str. Fix the arguments and try again.
```

For bad arguments the hint tells the model to fix them. Your own tools can raise `ToolCallError` for the same treatment, for example when a value is the right type but out of range. `final_answer` in the list is a built-in tool the model can call to end a run.

## 3. A tool that takes too long

Give a tool a time limit with `@tool(timeout=...)`, or every tool a default with `Agent(tool_timeout=...)`. When the limit passes, the model gets a timeout error as the result.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, ToolResultEvent, tool
from agentling.testing import ScriptedModel


@tool(timeout=0.1)
async def slow_lookup(city: str) -> str:
    """Look up a city's population.

    Args:
        city: The city to look up.
    """
    await asyncio.sleep(5)
    return "unknown"


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("call_1", "slow_lookup", {"city": "Lagos"})]),
        ChatMessage("assistant", "The lookup timed out, so I can't say."),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[slow_lookup])
    async for event in agent.run("How many people live in Lagos?", stream=True):
        if isinstance(event, ToolResultEvent):
            print(event.result.error_kind, event.result.content)


asyncio.run(main())
```

```text
timeout ToolTimeoutError: tool 'slow_lookup' exceeded its 0.1s timeout
```

A timeout stops the loop waiting, but it can't stop a synchronous function that is already running in its worker thread. Prefer `async def` tools when time limits matter.

## 4. A model that fails

Model adapters report failures as `ModelError` subclasses, and each says whether trying again might help. A rate limit or a server error is retryable; a bad key isn't. The loop retries a turn that failed before sending anything, up to `RetryPolicy.max_retries` times (2 by default), and calls `on_retry` before each wait.

```python
import asyncio

from agentling import (
    Agent,
    ChatMessage,
    ModelAuthError,
    ModelRateLimitError,
    RetryPolicy,
)
from agentling.testing import ScriptedModel


def report(attempt: int, max_retries: int, error: Exception, delay: float) -> None:
    print(f"retry {attempt} of {max_retries} after {type(error).__name__}")


async def main() -> None:
    busy = ScriptedModel(
        [ModelRateLimitError("slow down", retry_after=0), ChatMessage("assistant", "Done.")]
    )
    agent = Agent(model=busy, retry=RetryPolicy(on_retry=report))
    print(await agent.run("Say done."))

    locked_out = ScriptedModel([ModelAuthError("invalid API key", status=401)])
    try:
        await Agent(model=locked_out).run("Say done.")
    except ModelAuthError as error:
        print(f"gave up: {error} (status {error.status}, retryable {error.retryable})")


asyncio.run(main())
```

```text
retry 1 of 2 after ModelRateLimitError
Done.
gave up: invalid API key (status 401, retryable False)
```

The rate-limit error said to wait 0 seconds (`retry_after=0`), so the retry was immediate. Without `retry_after`, the wait starts at about `base_delay` (0.5 s) and doubles each attempt, with a little random jitter. Pass `retry=None` to turn retries off. A turn that already streamed text is never retried, so your user never sees the same words twice and no tool runs twice.

## The complete program

The program from the last chapter, with a `divide` tool, a model that hits a rate limit and then divides by zero, error results marked in the output, and model failures caught at the top. It leaves out the token count, to keep the output about failures; the `FinalEvent` still carries it.

```python title="handle_failures.py"
import asyncio

from agentling import (
    Agent,
    ChatMessage,
    Event,
    FinalEvent,
    ModelError,
    ModelRateLimitError,
    RetryPolicy,
    TextDelta,
    ToolCall,
    ToolCallEvent,
    ToolResultEvent,
    tool,
)
from agentling.testing import ScriptedModel


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
            ModelRateLimitError("slow down", retry_after=0),
            ChatMessage(
                "assistant",
                "Working it out.",
                tool_calls=[
                    ToolCall("call_1", "add", {"a": 19, "b": 23}),
                    ToolCall("call_2", "divide", {"a": 42, "b": 0}),
                ],
            ),
            ChatMessage("assistant", "19 + 23 = 42, and 42 can't be divided by zero."),
        ]
    )


def report(attempt: int, max_retries: int, error: Exception, delay: float) -> None:
    print(f"(retry {attempt} of {max_retries} after {type(error).__name__})")


def render(event: Event) -> None:
    match event:
        case TextDelta(text=text):
            print(text)
        case ToolCallEvent(tool_call=call):
            print(f"  -> {call.name}({call.arguments})")
        case ToolResultEvent(result=result):
            mark = "error" if result.is_error else "ok"
            print(f"  <- {result.name} [{mark}]: {result.content}")
        case FinalEvent(status=status):
            print(f"({status})")


async def main() -> None:
    agent = Agent(
        model=build_model(),
        tools=[add, multiply, divide],
        tool_timeout=10,
        retry=RetryPolicy(on_retry=report),
    )
    try:
        async for event in agent.run("What is 19 + 23, divided by 0?", stream=True):
            render(event)
    except ModelError as error:
        print(f"The model failed: {error}")


if __name__ == "__main__":
    asyncio.run(main())
```

It prints:

```text
(retry 1 of 2 after ModelRateLimitError)
Working it out.
  -> add({'a': 19, 'b': 23})
  -> divide({'a': 42, 'b': 0})
  <- add [ok]: 42
  <- divide [error]: ZeroDivisionError: division by zero
19 + 23 = 42, and 42 can't be divided by zero.
(completed)
```

## What you built

An agent whose tool failures become results the model can read, with a time limit on every tool, retries for a busy model and a clear stop when the model can't be reached. Next, you'll keep a conversation going across runs and pick up a run that was stopped: [Keep memory and resume](/docs/tutorial/memory-and-resume).
