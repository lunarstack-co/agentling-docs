---
title: Memory
slug: memory
description: The step types a run is recorded as, the Memory that holds them, and the saved format.
order: 6
metaTitle: "Memory reference: steps and saving"
metaDescription: "TaskStep, ActionStep, FinalStep, ToolResult and Memory: their fields, how they render to messages, and the JSON format dump_json and load_json use."
---

`agentling.memory` records a run as typed steps and saves them to JSON. Import the types from `agentling`. For saving and restoring a session in an app, see [Persist sessions](/docs/how-to/persist-sessions).

## Steps

`Step` is the union `TaskStep | ActionStep | FinalStep`. Each step has `to_messages() -> list[ChatMessage]`, which renders it into the messages the model sees.

| Step | Fields | Renders as |
| --- | --- | --- |
| `TaskStep` | `task: str` | One user message. |
| `ActionStep` | `model_message: ChatMessage`, `tool_results: list[ToolResult] = []`, `error: str \| None = None`, `usage: Usage \| None = None`, `duration: float \| None = None` | The assistant turn, then one tool message per result. |
| `FinalStep` | `answer: str` | One assistant message with the answer. |

An `ActionStep` is one model turn that asked for tools. `duration` is seconds of wall-clock time for the step. The loop doesn't set `error`; it is there for your own code and old saves. A `FinalStep` keeps only the answer text: reasoning and `provider_data` from a text-only final turn aren't stored.

An error result renders with a hint for the model: `Error from 'tool': <message>. Fix the arguments and try again.` when `error_kind` is `"validation"`, and `... Consider a different approach or tool.` otherwise.

## ToolResult

`ToolResult(tool_call_id: str, name: str, content: str, is_error: bool = False, error_kind: str | None = None)`

| Field | Meaning |
| --- | --- |
| `tool_call_id` | The id of the call this answers. |
| `name` | The tool's name. |
| `content` | The tool's output as a string, or the error message. Cut to `max_tool_output_chars` when set. |
| `is_error` | `True` when the call failed. |
| `error_kind` | `"validation"`, `"execution"`, `"timeout"` or `"unknown_tool"`; `None` on success. |

## Memory

`Memory(steps: list[Step] = [])`. Each session has one at `session.memory`.

| Method | Meaning |
| --- | --- |
| `add(step: Step) -> None` | Appends a step. |
| `reset() -> None` | Removes every step. `run(reset=True)` calls it. |
| `to_messages(system_prompt: str) -> list[ChatMessage]` | The system prompt, then every step's messages, in order. The system prompt is never stored as a step. |
| `to_dict() -> dict[str, Any]` | A JSON-safe dict, each step tagged with its kind. |
| `Memory.from_dict(data: dict[str, Any]) -> Memory` | Class method. Rebuilds a memory from `to_dict()` output. |
| `dump_json() -> str` | `to_dict()` as a JSON string. |
| `Memory.load_json(raw: str) -> Memory` | Class method. Rebuilds a memory from `dump_json()` output. |

**Raises:** `from_dict` and `load_json` raise `MemoryLoadError` for a version they can't read, an unknown step type or a missing required field. `load_json` raises `json.JSONDecodeError` for text that isn't JSON. Keys a step doesn't define are ignored, and missing optional fields take their defaults.

## The saved format

```text
{"version": 2, "steps": [{"type": "task", "data": {"task": "..."}},
                         {"type": "action", "data": {"model_message": {...}, "tool_results": [...], ...}},
                         {"type": "final", "data": {"answer": "..."}}]}
```

`dump_json()` writes format 2. It adds `reasoning`, `finish_reason` and `provider_data` to messages, and `cached_input_tokens` and `reasoning_tokens` to usage. Format 1, written by 0.1, still loads, with those fields at their defaults. Agentling 0.1 can't read format 2.

## Example

```python
from agentling import Agent, ChatMessage, FinalStep, Memory, TaskStep, ToolCall, tool
from agentling.testing import ScriptedModel


@tool
def double(n: int) -> int:
    """Double a number.

    Args:
        n: The number.
    """
    return n * 2


model = ScriptedModel(
    [
        ChatMessage("assistant", tool_calls=[ToolCall("c1", "double", {"n": 21})]),
        ChatMessage("assistant", "42"),
    ]
)
session = Agent(model=model, tools=[double]).start()
await session.run("Double 21.")

saved = session.memory.dump_json()
restored = Memory.load_json(saved)

print([type(step).__name__ for step in restored.steps])
print(restored.steps[1].tool_results[0].content)
print(isinstance(restored.steps[0], TaskStep), isinstance(restored.steps[-1], FinalStep))
print([m.role for m in restored.to_messages("You are terse.")])
```

Output:

```text
['TaskStep', 'ActionStep', 'FinalStep']
42
True True
['system', 'user', 'assistant', 'tool', 'assistant']
```
