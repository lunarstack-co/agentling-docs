---
title: Events
slug: events
description: The five event types a streamed run yields, their order, and print_events.
order: 5
metaTitle: "Events reference: streamed run events"
metaDescription: "TextDelta, ToolCallEvent, ToolResultEvent, StepEvent and FinalEvent: their fields, the order they arrive in, and the print_events renderer."
---

`agentling.events` defines what `run(..., stream=True)` yields. Import the types from `agentling`. For consuming a stream step by step, see [Stream events](/docs/tutorial/stream-events).

## The event types

All five are frozen dataclasses. `Event` is their union.

| Event | Fields | When |
| --- | --- | --- |
| `TextDelta` | `text: str` | A piece of streamed model text, as it arrives. Text on a tool-calling turn streams this way too. |
| `ToolCallEvent` | `tool_call: ToolCall` | Before a tool call runs. |
| `ToolResultEvent` | `result: ToolResult` | After a tool call finishes, successfully or with an error. |
| `StepEvent` | `step: Step` | After a step is recorded in memory. Carries the `ActionStep`. |
| `FinalEvent` | `answer: str`, `usage: Usage \| None = None`, `status: RunStatus = "completed"`, `finish_reason: FinishReason \| None = None` | Once, when the run ends. |

`ToolResult` and the step types are described in [Memory](/docs/reference/memory).

### FinalEvent

| Field | Meaning |
| --- | --- |
| `answer` | The final answer. `"Run interrupted."` when the run was interrupted. |
| `usage` | The run's total token usage, or `None` if the model never reported any. |
| `status` | `"completed"` when the model finished, `"interrupted"` when `interrupt()` stopped it, `"max_steps"` when the step limit forced a final answer (the `RunStatus` type). |
| `finish_reason` | Why the last model turn stopped, when the adapter said. `"length"` means the answer was cut off. |

## Order

Within a step the order is fixed:

1. the step's `TextDelta`s, as the model streams;
2. a `ToolCallEvent` for every tool call;
3. a `ToolResultEvent` for every result, in the same order as the calls;
4. the `StepEvent`.

A run that ends normally yields exactly one `FinalEvent`, last. A run that fails raises instead and yields no `FinalEvent`. Step callbacks run, and are awaited, before the step's `StepEvent`.

A call to `final_answer` gets no `ToolCallEvent` or `ToolResultEvent`: it is how the run ends, so its step's `StepEvent` is followed by the `FinalEvent`. The call and its result are still in the `StepEvent`'s `ActionStep` and in memory. A reply with no tool calls yields its `TextDelta`s and then the `FinalEvent`, with no `StepEvent`.

## print_events

```text
async print_events(events: AsyncIterator[Event], *, file: IO[str] | None = None) -> str
```

Prints a stream as it arrives and returns the final answer. Text prints as it streams; each tool call prints as `-> name({...})`, each result as `<- [ok] ...` or `<- [error] ...` (cut to 500 characters), and the answer as `= answer`. Writes to `file`, or stdout when it is `None`.

## Example

```python
from agentling import Agent, ChatMessage, FinalEvent, StepEvent, TextDelta, ToolCall
from agentling import ToolCallEvent, ToolResultEvent, Usage, tool
from agentling.testing import ScriptedModel


@tool
def shout(text: str) -> str:
    """Upper-case some text.

    Args:
        text: The text to shout.
    """
    return text.upper()


model = ScriptedModel(
    [
        ChatMessage(
            "assistant",
            "Shouting.",
            tool_calls=[ToolCall("c1", "shout", {"text": "hi"})],
            usage=Usage(10, 4),
        ),
        ChatMessage(
            "assistant",
            tool_calls=[ToolCall("c2", "final_answer", {"answer": "HI"})],
            usage=Usage(14, 3),
        ),
    ]
)
agent = Agent(model=model, tools=[shout])

async for event in agent.run("Shout hi.", stream=True):
    match event:
        case TextDelta(text=text):
            print("text", text)
        case ToolCallEvent(tool_call=call):
            print("call", call.name)
        case ToolResultEvent(result=result):
            print("result", result.content)
        case StepEvent():
            print("step")
        case FinalEvent(answer=answer, usage=usage, status=status):
            print("final", answer, usage.total_tokens, status)
```

Output:

```text
text Shouting.
call shout
result HI
step
step
final HI 31 completed
```
