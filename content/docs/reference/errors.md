---
title: Errors
slug: errors
description: The exception hierarchy, which failures the model recovers from, and what redact_errors changes.
order: 4
metaTitle: "Errors reference: the exception hierarchy"
metaDescription: "Every exception under AgentlingError, which failures the loop recovers from on its own, and what redact_errors changes about what the model sees."
---

agentling's own errors share one base class, `AgentlingError`. Other exceptions can still reach your code: `ValueError` or `TypeError` for bad configuration (an invalid tool name, a bad SKILL.md field), `yaml.YAMLError` for SKILL.md frontmatter that doesn't parse, and the provider SDK's own errors (such as `openai.APIError`) once retries are used up. Just as important is what does not raise: most tool failures become observations the model can recover from.

## The hierarchy

| Exception | Raised when |
| --- | --- |
| `AgentlingError` | The base class for agentling's own errors. |
| `ToolCallError` | A tool gets bad arguments: a missing required field, a wrong type, a value outside `enum`, or an extra key the schema forbids. Tools may also raise it themselves. The loop shows it to the model. |
| `ModelError` | A model turn exceeds `model_timeout`, or the model keeps sending tool calls that can't be parsed. |
| `ModelOutputError` | A tool call can't be parsed. The loop catches it and asks the model to try again, up to twice, before raising `ModelError`. |
| `ToolTimeoutError` | A tool runs past its timeout. It is not raised: it words the observation the model sees. |
| `MemoryLoadError` | Saved memory has an unknown version or a bad shape. Invalid JSON passed to `Memory.load_json` raises `json.JSONDecodeError` instead. |
| `AgentRunError`, `ToolExecutionError`, `SkillLoadError` | Reserved. agentling doesn't raise these yet; they are exported so your code can catch them once it does. |

## Observations, not crashes

The loop draws a clear line between failures the model can fix and failures your code must handle.

**Fed back to the model as observations.** Anything that goes wrong inside a tool call becomes a `ToolResult` with `is_error=True`, tagged by kind. That includes a `ToolCallError` from invalid arguments, an exception raised by the tool body, a tool timeout, and a call to an unknown tool. The observation carries a hint matched to the failure: an invalid-argument error says "Fix the arguments and try again", while an execution, timeout, or unknown-tool error says "Consider a different approach or tool". The model gets a chance to correct course, and one bad tool call does not kill the run. See [Error handling](/docs/guides/error-handling) for the practical patterns.

**Raised to the caller.** Failures the model can't repair reach your code as exceptions: a `ModelError` when a turn exceeds its time budget or the model keeps sending unparseable tool calls, the provider SDK's error when its retries are used up, and a `MemoryLoadError` when saved memory doesn't validate on load.

## redact_errors

By default, the message of an unexpected tool exception is included in the observation, because it is usually the fastest way for the model to recover. If your tools can leak sensitive detail through exception messages, construct the agent with `redact_errors=True`:

```python
agent = Agent(model=model, tools=[query_db], redact_errors=True)
```

With redaction on, the model still sees that the tool failed and the exception type, but the message itself is withheld and logged via the `agentling` logger instead. Pair it with `max_tool_output_chars` to also bound what tool output enters the context. See the project's security policy for the full trust model.

## Related pages

- [Error handling](/docs/guides/error-handling) covers recovery patterns and loop detection.
- [Agent API](/docs/reference/agent-api) lists `redact_errors`, `tool_timeout`, and `model_timeout`.
