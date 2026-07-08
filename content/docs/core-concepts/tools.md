---
title: Tools
slug: tools
description: Plain Python functions become schema-validated tools with @tool.
order: 2
---

A tool is any Python function wrapped with `@tool`. The function name becomes the tool name, the docstring summary becomes the description, and the type hints plus a Google-style `Args:` section become the JSON Schema the model sees.

```python
from agentling import tool


@tool
async def search(query: str, limit: int = 5) -> str:
    """Search the docs and return the top matches.

    Args:
        query: What to search for.
        limit: How many results to return.
    """
    ...
```

Both synchronous and asynchronous functions are supported. A synchronous tool runs in a worker thread so it cannot block the event loop.

## Schemas and validation

Supported parameter types map directly to JSON Schema: `str`, `int`, `float`, `bool`, `list[...]`, `dict[...]`, `Optional[...]` or `X | None` (treated as "may be omitted"), and `Literal[...]` (becomes an enum). Parameters without a default are marked required.

`*args`, `**kwargs`, and positional-only parameters are rejected at registration time, because a tool is always called with a JSON object of named arguments.

If the model sends arguments that do not match the schema, a missing required field, a wrong type, or an unknown key, the tool raises a `ToolCallError` which the loop feeds back to the model as an error observation. The model gets a chance to fix its call rather than the run blowing up. See [Error handling](/docs/guides/error-handling) for the full recovery story.

## The built-in final_answer tool

Every agent has a built-in `final_answer` tool. The model can call it to end the run explicitly, or it can just reply with plain text; both terminate the run. See [The Agent Loop](/docs/core-concepts/agent-loop) for how termination works.

## Per-tool metadata

Tools carry their own execution metadata: a per-call `timeout`, a `parallel_safe` flag, and `max_output_chars` to bound how much of the result reaches the model.

One caveat on timeouts: a timeout stops the agent from waiting on a tool and turns it into an observation, but a synchronous tool already running in a thread cannot be forcibly cancelled and will finish in the background. Prefer async tools, or make blocking tools cooperative, when timeouts matter.

## Stateful tools

For stateful tools, subclass `Tool` directly instead of using the decorator. This is useful when a tool needs a client, a connection pool, or configuration that outlives a single call.

## Concurrent execution

When a single model turn requests several tool calls, they run concurrently with `asyncio.gather` by default. Set `parallel_tools=False` on the [Agent](/docs/reference/agent-api) to run them in order instead, which is useful when tools share state or must not interleave.
