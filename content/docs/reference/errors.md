---
title: Errors
slug: errors
description: Every exception Agentling defines, which ones the loop retries, and which ones reach your code.
order: 4
metaTitle: "Errors reference: exception classes"
metaDescription: "AgentlingError and its subclasses, the ModelError family with retryable defaults, retry_after and status, and which failures reach your code."
---

`agentling.errors` defines the exceptions Agentling raises and the `ModelError` classes adapters raise. Import them from `agentling`. For handling failures in a running agent, see [Handle failures](/docs/tutorial/handle-failures).

## The hierarchy

```text
AgentlingError
├── AgentRunError                 reserved, not raised yet
├── ModelError
│   ├── ModelConnectionError
│   ├── ModelRateLimitError
│   ├── ModelServerError
│   ├── ModelTimeoutError
│   ├── ModelAuthError
│   ├── ModelBadRequestError
│   ├── ModelContextLengthError
│   ├── ModelOutputError
│   └── ModelOutputTruncatedError
├── ToolCallError                 shown to the model, never raised from a run
├── ToolExecutionError            reserved, not raised yet
│   └── ToolTimeoutError          words the timeout result the model sees
├── MemoryLoadError
└── SkillLoadError                reserved, not raised yet
```

Other exceptions can still reach you: `ValueError` and `TypeError` for bad configuration, and any non-`ModelError` exception an adapter raises, unchanged, because that is a bug in the adapter.

## ModelError

```text
ModelError(message: str = "", *, retryable: bool | None = None,
           retry_after: float | None = None, status: int | None = None)
```

| Attribute | Default | Meaning |
| --- | --- | --- |
| `retryable` | the class's `default_retryable` | Whether the same request might succeed if sent again. |
| `retry_after` | `None` | Seconds the backend asked the caller to wait, if it said. |
| `status` | `None` | The HTTP status, when there was one. |
| `default_retryable` | `False` | Class attribute; subclasses set their own. |

The loop retries a turn only when it raised a `ModelError` with `retryable=True` before yielding anything, under the agent's [RetryPolicy](/docs/reference/retry). Every other `ModelError` ends the run and is raised from `run()` or `resume()`.

| Class | Raise it when | Retryable by default |
| --- | --- | --- |
| `ModelConnectionError` | The backend can't be reached: DNS, a refused or dropped connection. | yes |
| `ModelRateLimitError` | HTTP 429. Pass the `Retry-After` value as `retry_after`. | yes |
| `ModelServerError` | HTTP 5xx, or the backend reports an overload. | yes |
| `ModelTimeoutError` | The request timed out. The loop also raises it when a chunk takes longer than `model_timeout`. | yes |
| `ModelAuthError` | HTTP 401 or 403, or the backend's own "bad key" error. | no |
| `ModelBadRequestError` | The backend rejected the request itself: an unknown model, a bad field, another 4xx. | no |
| `ModelContextLengthError` | The conversation no longer fits the context window. | no |
| `ModelOutputError` | The output can't be used. The loop raises it when `provider_data` isn't JSON-serialisable. | no |
| `ModelOutputTruncatedError` | Raised by the loop when the output limit cuts a tool call short. Adapters don't raise it. | no |

When a turn's tool calls can't be parsed (a missing name, arguments that aren't a JSON object), the loop doesn't raise straight away. It tells the model what was wrong and asks again, up to twice in a row, then raises a plain `ModelError` whose message says how many turns failed. If the turn also stopped at the output limit, it raises `ModelOutputTruncatedError` at once instead.

## Other classes

| Class | Raised by | Meaning |
| --- | --- | --- |
| `AgentlingError` | never directly | Base class for every Agentling error. |
| `ToolCallError` | argument validation, or your tool | A tool call had bad arguments. The model sees the message and can fix the call. See [Tools](/docs/reference/tools). |
| `ToolTimeoutError` | nobody | A tool ran past its timeout. The loop uses it only to word the error result the model sees. |
| `MemoryLoadError` | `Memory.from_dict`, `Memory.load_json` | Saved memory has an unknown version, an unknown step type or a missing field. See [Memory](/docs/reference/memory). |
| `AgentRunError`, `ToolExecutionError`, `SkillLoadError` | nobody yet | Reserved and exported so code can catch them once they are raised. A bad `SKILL.md` raises `ValueError` or `yaml.YAMLError` today. |

## What the model sees instead

A tool that raises doesn't end the run. Its exception becomes the tool's result, marked as an error, with a hint: "Fix the arguments and try again" for a `ToolCallError`, "Consider a different approach or tool" for anything else, a timeout, or an unknown tool name. With `redact_errors=True` the message of an unexpected exception is logged instead of shown; `ToolCallError` messages are always shown.

## Example

```python
from agentling import Agent, ChatMessage, ModelAuthError, ModelServerError, RetryPolicy
from agentling.testing import ScriptedModel

for name, cls in [("server", ModelServerError), ("auth", ModelAuthError)]:
    print(name, "retryable:", cls.default_retryable)

model = ScriptedModel([ModelServerError("overloaded"), ChatMessage("assistant", "ok")])
agent = Agent(model=model, retry=RetryPolicy(base_delay=0, jitter=0))
print(await agent.run("hi"), len(model.calls))

agent = Agent(model=ScriptedModel([ModelAuthError("bad key", status=401)]))
try:
    await agent.run("hi")
except ModelAuthError as exc:
    print(type(exc).__name__, exc.status, exc.retryable)
```

Output:

```text
server retryable: True
auth retryable: False
ok 2
ModelAuthError 401 False
```
