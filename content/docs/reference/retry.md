---
title: RetryPolicy
slug: retry
description: How the loop retries a model turn that failed, and the delay it waits.
order: 8
metaTitle: "RetryPolicy reference: retrying turns"
metaDescription: "RetryPolicy's fields and defaults, which failures are retried, how the delay is worked out, and the on_retry hook."
---

`agentling.retry` sets how the loop retries a model turn that failed. Adapters never retry; the loop does, under the agent's policy. Import `RetryPolicy` from `agentling` and pass it as `Agent(retry=...)`.

## RetryPolicy

```text
RetryPolicy(max_retries: int = 2, base_delay: float = 0.5, max_delay: float = 30.0,
            jitter: float = 0.2, on_retry: OnRetry | None = None)
```

A frozen dataclass, so one policy can be shared by every agent. `Agent(retry=None)` turns retries off.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `max_retries` | `2` | Retries after the first attempt. |
| `base_delay` | `0.5` | Seconds before the first retry. Doubles each retry, unless the backend sent `retry_after`. |
| `max_delay` | `30.0` | Cap on any one delay, including a backend's `retry_after`, so a hostile `Retry-After` header can't stall a run. |
| `jitter` | `0.2` | Each delay is multiplied by a random factor in `[1 - jitter, 1 + jitter]`, so many clients don't retry in step. `0` turns it off. |
| `on_retry` | `None` | Called as `on_retry(attempt, max_retries, error, delay)` before each wait, with `attempt` counting from 1. Awaited when it returns an awaitable. If it raises, the run stops with that exception. |

## What is retried

A turn is retried only when:

- it raised a `ModelError` whose `retryable` is `True` (see the table in [Errors](/docs/reference/errors)), and
- it hadn't yielded any `Delta` yet. Once text has reached the caller, a retry would repeat it, so the error is raised instead.

No tool runs twice, because tools run only after a turn completes. `interrupt()` during a wait ends the run as interrupted, with no further attempt. When the retries are used up, the last error is raised from `run()`.

## The delay

For retry number `n`, counting from 0:

```text
delay = error.retry_after if the backend sent one, else base_delay * 2 ** n
delay = delay * random factor in [1 - jitter, 1 + jitter]   (when jitter is not 0)
delay = max(0, min(max_delay, delay))
```

With the defaults the waits are about 0.5 and 1 second.

## Example

```python
from agentling import Agent, ChatMessage, ModelRateLimitError, RetryPolicy
from agentling.testing import ScriptedModel


def log(attempt: int, max_retries: int, error: Exception, delay: float) -> None:
    print(f"retry {attempt}/{max_retries} after {delay}s: {error}")


policy = RetryPolicy(max_retries=3, base_delay=0.01, jitter=0, on_retry=log)
model = ScriptedModel(
    [
        ModelRateLimitError("slow down", retry_after=0.02),
        ModelRateLimitError("slow down"),
        ChatMessage("assistant", "Done."),
    ]
)
print(await Agent(model=model, retry=policy).run("hi"))
```

Output:

```text
retry 1/3 after 0.02s: slow down
retry 2/3 after 0.02s: slow down
Done.
```
