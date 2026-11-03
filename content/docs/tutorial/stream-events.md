---
title: Stream events
slug: stream-events
description: Watch the loop as it runs, one typed event at a time.
order: 1
metaTitle: "Stream an agent's events as they happen"
metaDescription: "Run an Agentling agent with stream=True and handle text, tool calls, tool results, steps and the final answer as typed events, in a fixed order."
---

By the end of this chapter your agent will print each step of its work as it happens: text as it streams, every tool call and its result, and the final answer with its token usage.

**You need:** the program from [Your first agent](/docs/getting-started/quickstart).

## 1. Ask for a stream

`agent.run(task)` waits for the answer. `agent.run(task, stream=True)` returns an async generator of events from the same loop instead. This version of the script gives the model two tools, has it say something before calling both, and reports token usage on each turn.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, Usage, tool
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


model = ScriptedModel(
    [
        ChatMessage(
            "assistant",
            "Working it out.",
            tool_calls=[
                ToolCall("call_1", "add", {"a": 19, "b": 23}),
                ToolCall("call_2", "multiply", {"a": 6, "b": 7}),
            ],
            usage=Usage(input_tokens=120, output_tokens=30),
        ),
        ChatMessage("assistant", "Both come to 42.", usage=Usage(input_tokens=180, output_tokens=8)),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[add, multiply])
    async for event in agent.run("What are 19 + 23 and 6 * 7?", stream=True):
        print(type(event).__name__)


asyncio.run(main())
```

```text
TextDelta
ToolCallEvent
ToolCallEvent
ToolResultEvent
ToolResultEvent
StepEvent
TextDelta
FinalEvent
```

The two tool calls ran concurrently, because Agentling runs every tool call in a step at the same time unless a tool says it isn't safe to.

## 2. Handle each event type

There are five event types, and within a step they always arrive in this order: the text chunks, every `ToolCallEvent`, every `ToolResultEvent` in the same order, then one `StepEvent` once the step is saved to memory. A run that ends normally finishes with exactly one `FinalEvent`.

```python
import asyncio

from agentling import (
    Agent,
    ChatMessage,
    FinalEvent,
    StepEvent,
    TextDelta,
    ToolCall,
    ToolCallEvent,
    ToolResultEvent,
    Usage,
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


model = ScriptedModel(
    [
        ChatMessage(
            "assistant",
            "Working it out.",
            tool_calls=[
                ToolCall("call_1", "add", {"a": 19, "b": 23}),
                ToolCall("call_2", "multiply", {"a": 6, "b": 7}),
            ],
            usage=Usage(input_tokens=120, output_tokens=30),
        ),
        ChatMessage("assistant", "Both come to 42.", usage=Usage(input_tokens=180, output_tokens=8)),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[add, multiply])
    async for event in agent.run("What are 19 + 23 and 6 * 7?", stream=True):
        match event:
            case TextDelta(text=text):
                print(f"text: {text!r}")
            case ToolCallEvent(tool_call=call):
                print(f"call: {call.name} {call.arguments}")
            case ToolResultEvent(result=result):
                print(f"result: {result.name} -> {result.content}")
            case StepEvent(step=step):
                print(f"step saved with {len(step.tool_results)} results")
            case FinalEvent(answer=answer, status=status, usage=usage):
                print(f"final: {answer} ({status}, {usage.total_tokens} tokens)")


asyncio.run(main())
```

```text
text: 'Working it out.'
call: add {'a': 19, 'b': 23}
call: multiply {'a': 6, 'b': 7}
result: add -> 42
result: multiply -> 42
step saved with 2 results
text: 'Both come to 42.'
final: Both come to 42. (completed, 338 tokens)
```

`FinalEvent.usage` is the total for the whole run. It is `None` when the model never reports usage, so check before you read it in code that may run against other models.

## 3. Use the built-in printer

For a terminal, `print_events` does the rendering for you and returns the answer. It prints text as it arrives, an arrow line for each tool call and result, and the answer last.

```python
import asyncio

from agentling import Agent, ChatMessage, ToolCall, print_events, tool
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
        ChatMessage("assistant", "Adding.", tool_calls=[ToolCall("call_1", "add", {"a": 19, "b": 23})]),
        ChatMessage("assistant", "19 + 23 = 42."),
    ]
)


async def main() -> None:
    agent = Agent(model=model, tools=[add])
    answer = await print_events(agent.run("What is 19 + 23?", stream=True))
    print("returned:", answer)


asyncio.run(main())
```

```text
Adding.
-> add({"a": 19, "b": 23})
<- [ok] 42
19 + 23 = 42.
= 19 + 23 = 42.
returned: 19 + 23 = 42.
```

If you stop reading a stream before it ends, close it with `contextlib.aclosing`. Until the stream is closed, the session counts as running and refuses a new run.

## The complete program

```python title="stream_events.py"
import asyncio

from agentling import (
    Agent,
    ChatMessage,
    Event,
    FinalEvent,
    StepEvent,
    TextDelta,
    ToolCall,
    ToolCallEvent,
    ToolResultEvent,
    Usage,
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


def build_model() -> ScriptedModel:
    return ScriptedModel(
        [
            ChatMessage(
                "assistant",
                "Working it out.",
                tool_calls=[
                    ToolCall("call_1", "add", {"a": 19, "b": 23}),
                    ToolCall("call_2", "multiply", {"a": 6, "b": 7}),
                ],
                usage=Usage(input_tokens=120, output_tokens=30),
            ),
            ChatMessage(
                "assistant", "Both come to 42.", usage=Usage(input_tokens=180, output_tokens=8)
            ),
        ]
    )


def render(event: Event) -> None:
    match event:
        case TextDelta(text=text):
            print(text)
        case ToolCallEvent(tool_call=call):
            print(f"  -> {call.name}({call.arguments})")
        case ToolResultEvent(result=result):
            print(f"  <- {result.name}: {result.content}")
        case StepEvent():
            pass
        case FinalEvent(usage=usage):
            tokens = usage.total_tokens if usage else "unknown"
            print(f"(tokens: {tokens})")


async def main() -> None:
    agent = Agent(model=build_model(), tools=[add, multiply])
    async for event in agent.run("What are 19 + 23 and 6 * 7?", stream=True):
        render(event)


if __name__ == "__main__":
    asyncio.run(main())
```

It prints:

```text
Working it out.
  -> add({'a': 19, 'b': 23})
  -> multiply({'a': 6, 'b': 7})
  <- add: 42
  <- multiply: 42
Both come to 42.
(tokens: 338)
```

## What you built

A program that shows the loop as it runs, with one handler per event type and the run's token total at the end. Next, you'll break things on purpose and see how the loop recovers: [Handle failures](/docs/tutorial/handle-failures).
