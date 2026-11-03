---
title: Agent and AgentSession
slug: agent-and-session
description: The Agent configuration, the AgentSession that runs it, and every argument they take.
order: 1
metaTitle: "Agent and AgentSession reference"
metaDescription: "Signatures, parameters, defaults and errors for Agent and AgentSession: run, resume, interrupt, add_tools, remove_tools and is_running."
---

`agentling.agent` holds the loop. `Agent` is configuration shared by every run; `AgentSession` holds one conversation and runs the loop. Import both from `agentling`. For a walk through using them, start with [Your first agent](/docs/getting-started/quickstart).

## Agent

```text
Agent(
    model: Model,
    tools: Sequence[Tool] = (),
    skills: Sequence[Skill | str | Path] = (),
    instructions: str | None = None,
    max_steps: int = 15,
    step_callbacks: Sequence[StepCallback] = (),
    parallel_tools: bool = True,
    tool_timeout: float | None = None,
    model_timeout: float | None = None,
    max_tool_output_chars: int | None = None,
    redact_errors: bool = False,
    context_manager: Callable[[list[ChatMessage]], list[ChatMessage]] | None = None,
    retry: RetryPolicy | None = RetryPolicy(),
)
```

An `Agent` holds no per-run state, so one agent can serve many concurrent runs.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `model` | required | Any object with an async-generator `stream(messages, tools)`. See [Models and message types](/docs/reference/models). |
| `tools` | `()` | Tools the model can call. `final_answer` is always added. |
| `skills` | `()` | `Skill` objects, or paths to skill folders. |
| `instructions` | `None` | The system prompt. `None` uses `DEFAULT_INSTRUCTIONS`. The skill catalog is appended when there are skills. |
| `max_steps` | `15` | Model turns before a forced, tool-free final answer. Turns whose tool calls can't be parsed don't count. |
| `step_callbacks` | `()` | Called in order with each `ActionStep` before its `StepEvent`. Async callbacks are awaited; one that raises stops the run. |
| `parallel_tools` | `True` | Run a step's tool calls concurrently, unless one of the tools has `parallel_safe=False`. |
| `tool_timeout` | `None` | Seconds allowed per tool call, for tools that don't set their own. A timeout becomes an error result the model sees. |
| `model_timeout` | `None` | Seconds to wait for each streamed chunk, not the whole turn. Exceeding it raises `ModelTimeoutError`. |
| `max_tool_output_chars` | `None` | Cap on each tool result, for tools that don't set their own. The middle is cut. |
| `redact_errors` | `False` | Log tool exceptions instead of showing their message to the model. `ToolCallError` messages are always shown. |
| `context_manager` | `None` | Called with the full message list before each model call; the list it returns is what the model sees. |
| `retry` | `RetryPolicy()` | How failed model turns are retried. `None` turns retries off. See [RetryPolicy](/docs/reference/retry). |

**Raises** `ValueError` when `max_steps` is below 1, two tools share a name, or a tool is named `load_skill` while skills are configured. Raises `TypeError` when `model` has no callable `stream`, or `stream` is a plain coroutine function rather than an async generator. A bad tool name or schema raises `ValueError` (see [Tools](/docs/reference/tools)).

### Methods

| Method | Returns | Meaning |
| --- | --- | --- |
| `start()` | `AgentSession` | A new session with its own memory, tools and interrupt flag. |
| `run(task, *, stream=False, reset=True, max_steps=None)` | as `AgentSession.run` | Runs `task` on a new session and discards it. |

`agentling.agent.DEFAULT_INSTRUCTIONS` is the default system prompt. It tells the model to use the tools and to end with `final_answer` or a plain-text reply.

## AgentSession

Create one with `agent.start()`. A session owns its `Memory`, its interrupt flag and a copy of the agent's tools, so tools added to one session never reach another.

| Attribute | Type | Meaning |
| --- | --- | --- |
| `agent` | `Agent` | The configuration this session runs. |
| `memory` | `Memory` | The run's steps. Replace it to restore a saved session. See [Memory](/docs/reference/memory). |
| `tools` | `dict[str, Tool]` | This session's tools by name. Change them with `add_tools` and `remove_tools`. |
| `step_callbacks` | `list[StepCallback]` | A copy of the agent's callbacks; append to it for this session only. |
| `is_running` | `bool` | `True` while a run or resume is in progress. Read only. |

### run

```text
run(task: str, *, stream: bool = False, reset: bool = True, max_steps: int | None = None)
    -> Coroutine[Any, Any, str] | AsyncGenerator[Event, None]
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `task` | required | The user's message. |
| `stream` | `False` | `False` returns an awaitable of the final answer; `True` returns an async generator of [events](/docs/reference/events). |
| `reset` | `True` | `True` clears memory first. `False` keeps it and adds `task` as the next user turn. |
| `max_steps` | `None` | Overrides the agent's limit for this run. At least 1. |

**Raises** `RuntimeError` if the session is already running, `ValueError` if `max_steps` is below 1, and a [`ModelError` subclass](/docs/reference/errors) if the model fails after retries, times out, or keeps sending tool calls that can't be parsed. A streamed run counts as running until its last event is consumed; close an abandoned stream with `contextlib.aclosing`.

### resume

```text
resume(*, stream: bool = False, max_steps: int | None = None)
    -> Coroutine[Any, Any, str] | AsyncGenerator[Event, None]
```

Continues an interrupted or failed run from memory without adding a task. Same return types as `run`; `max_steps` counts from this call. **Raises** `ValueError("Nothing to resume")` when memory is empty or already ends with an answer, and `RuntimeError` if the session is running.

### interrupt

`interrupt() -> None` asks the current run to stop at its next step, streamed chunk or retry wait. The run ends with a `FinalEvent` whose status is `"interrupted"`, and `resume()` carries on from there. It has no effect when no run is active. A run clears the flag, and `is_running` turns true, when its first step begins rather than when `run()` is called, so an interrupt sent before the task's first step is lost; `await asyncio.sleep(0)` after `create_task` closes the gap. From another thread, call `loop.call_soon_threadsafe(session.interrupt)`.

### add_tools and remove_tools

```text
add_tools(tools: Iterable[Tool], *, replace: bool = False) -> None
remove_tools(names: Iterable[str]) -> None
```

Both change the tools the model sees from its next call. Both are all or nothing: they **raise** `ValueError` and change nothing if any tool has a bad name or schema, uses a reserved name (`final_answer`, and `load_skill` when skills are configured), duplicates an existing name (unless `replace=True`), or, for `remove_tools`, isn't there.

## Example

```python
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
        ChatMessage("assistant", tool_calls=[ToolCall("c1", "add", {"a": 2, "b": 3})]),
        ChatMessage("assistant", "5"),
        ChatMessage("assistant", "Still 5."),
    ]
)
agent = Agent(model=model, tools=[add], max_steps=5)
session = agent.start()

print(await session.run("What is 2 + 3?"))
print(await session.run("And again?", reset=False))
print(len(session.memory.steps), session.is_running)
print(sorted(session.tools))
```

Output:

```text
5
Still 5.
5 False
['add', 'final_answer']
```
