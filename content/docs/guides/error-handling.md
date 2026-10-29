---
title: Error Handling
slug: error-handling
description: Self-healing tool errors, timeouts, redaction, output truncation, and the retry behavior of the model layer.
order: 4
---

agentling treats failure as something the model can recover from, not something that kills the run. This guide covers the layers of that design: self-healing tool errors, timeouts, redaction, and how the model layer retries.

## Self-healing tool errors

When a tool raises, the loop catches the exception and turns it into a `ToolResult` with `is_error=True`, tagged by the kind of failure. The model sees the error as an observation, along with a hint that depends on what went wrong:

| Failure kind | Hint the model sees |
| --- | --- |
| Invalid arguments | "Fix the arguments and try again" |
| Execution, timeout, or unknown tool | "Consider a different approach or tool" |

So a bad tool call becomes a course correction rather than a crash.

Argument validation happens before the tool runs. If the model sends arguments that do not match the schema (a missing required field, a wrong type, an unknown key), the tool raises `ToolCallError`, which flows back to the model the same way. See [Tools](/docs/core-concepts/tools) for how schemas are generated.

## Timeouts

Two independent budgets, both set on the `Agent`:

```python
agent = Agent(
    model=OpenAIModel("gpt-4o-mini"),
    tools=[search],
    tool_timeout=30.0,    # per tool call, seconds
    model_timeout=60.0,   # per model turn, seconds
)
```

- `tool_timeout` turns a slow tool call into a recoverable error observation. One caveat: a synchronous tool already running in a worker thread cannot be forcibly cancelled and will finish in the background. Prefer async tools when timeouts matter.
- `model_timeout` bounds each model turn; exceeding it raises `ModelError`.

## Redaction and truncation

Tool output and error messages are fed back into the model's context, so two knobs let you control what leaks in:

- `redact_errors=True` hides unexpected tool-exception messages from the model. The exception type is still shown, and the full detail is logged via the `agentling` logger.
- `max_tool_output_chars` truncates oversized tool observations, keeping the head and tail.

## Retries in the model layer

`OpenAIModel` distinguishes transient from permanent failures. Rate limits, connection or timeout errors, and 5xx responses are retried with exponential backoff. Permanent errors, such as a bad request or bad auth, fail fast without retrying. Tune the behavior with `max_retries` and `retry_base_delay`; see [Using Other Providers](/docs/guides/other-providers).

## The exception hierarchy

agentling's own errors derive from `AgentlingError`, with subclasses such as `ToolCallError`, `ModelError`, and `MemoryLoadError`. Provider errors (for example `openai.APIError`, after retries) are not wrapped, so catch them too if you want one handler for a failed run:

```python
import openai

from agentling import AgentlingError

try:
    answer = await agent.run(task)
except (AgentlingError, openai.APIError) as exc:
    logger.error("agent run failed: %s", exc)
```

The full list lives in the [Errors reference](/docs/reference/errors).
