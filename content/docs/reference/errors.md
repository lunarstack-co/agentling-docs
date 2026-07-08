---
title: Errors
slug: errors
description: The exception hierarchy, which failures the model recovers from, and what redact_errors changes.
order: 4
---

Every exception agentling raises lives under a single base class, `AgentlingError`, so one `except` clause can catch anything the framework produces. Just as important is what does not raise: most tool failures are converted into observations the model can recover from instead of crashing the run.

## The hierarchy

| Exception | Raised when |
| --- | --- |
| `AgentlingError` | The base class for every framework error. Catch this to handle anything below. |
| `ToolCallError` | The model sends arguments that do not match a tool's schema: a missing required field, a wrong type, or an unknown key. |
| `ModelError` | A model turn fails permanently, or exceeds `model_timeout`. |
| `MemoryLoadError` | `Memory.load_json` receives data that fails validation and cannot be rebuilt into typed steps. |

## Observations, not crashes

The loop draws a clear line between failures the model can fix and failures your code must handle.

**Fed back to the model as observations.** Anything that goes wrong inside a tool call becomes a `ToolResult` with `is_error=True`, tagged by kind. That includes a `ToolCallError` from invalid arguments, an exception raised by the tool body, a tool timeout, and a call to an unknown tool. The observation carries a hint matched to the failure: an invalid-argument error says "Fix the arguments and try again", while an execution, timeout, or unknown-tool error says "Consider a different approach or tool". The model gets a chance to correct course, and one bad tool call does not kill the run. See [Error handling](/docs/guides/error-handling) for the practical patterns.

**Raised to the caller.** Failures the model cannot repair surface as exceptions in your code: a `ModelError` when the provider fails permanently or a turn exceeds its time budget, and a `MemoryLoadError` when saved memory does not validate on load.

## redact_errors

By default, the message of an unexpected tool exception is included in the observation, because it is usually the fastest way for the model to recover. If your tools can leak sensitive detail through exception messages, construct the agent with `redact_errors=True`:

```python
agent = Agent(model=model, tools=[query_db], redact_errors=True)
```

With redaction on, the model still sees that the tool failed and the exception type, but the message itself is withheld and logged via the `agentling` logger instead. Pair it with `max_tool_output_chars` to also bound what tool output enters the context. See the project's security policy for the full trust model.

## Related pages

- [Error handling](/docs/guides/error-handling) covers recovery patterns and loop detection.
- [Agent API](/docs/reference/agent-api) lists `redact_errors`, `tool_timeout`, and `model_timeout`.
