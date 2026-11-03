---
title: Tools
slug: tools
description: The @tool decorator, the Tool base class, ToolCallError and the schema rules.
order: 2
metaTitle: "Tools reference: @tool and Tool"
metaDescription: "Signatures and rules for @tool, the Tool base class, ToolCallError, argument validation and the JSON Schema built from type hints."
---

`agentling.tools` turns Python functions into tools the model can call and checks the arguments the model sends. Import `tool`, `Tool` and `ToolCallError` from `agentling`. To use tools from an existing JSON Schema or an MCP server, see [Use tools from a JSON Schema or MCP](/docs/how-to/tools-from-a-schema-or-mcp).

## tool

```text
tool(
    func: Callable[..., Any] | None = None,
    *,
    timeout: float | None = None,
    parallel_safe: bool = True,
    max_output_chars: int | None = None,
    validate_arguments: bool = True,
) -> Tool | Callable[[Callable[..., Any]], Tool]
```

Use it bare (`@tool`) or with options (`@tool(timeout=30)`). The function name becomes the tool name, the docstring summary its description, a Google-style `Args:` section the parameter descriptions, and the type hints the JSON Schema. The function may be sync or async; a sync function runs in a worker thread so it can't block the loop.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `func` | `None` | The function, when used bare. |
| `timeout` | `None` | Seconds allowed per call. `None` uses the agent's `tool_timeout`. |
| `parallel_safe` | `True` | `False` makes any step that calls this tool run its tool calls in order. |
| `max_output_chars` | `None` | Cap on the result's length. `None` uses the agent's `max_tool_output_chars`. |
| `validate_arguments` | `True` | `False` skips Agentling's argument check, for tools validated elsewhere. |

**Raises** `TypeError` when the function has `*args`, `**kwargs` or positional-only parameters, because a tool is called with a JSON object of named arguments. **Raises** `ValueError` when the name isn't 1 to 64 letters, digits, `_` or `-`.

### Type hints and the schema

| Hint | Schema |
| --- | --- |
| `str`, `int`, `float`, `bool` | `string`, `integer`, `number`, `boolean` |
| `list[X]` | `array` with `items` from `X` |
| `dict[...]` | `object` with no per-key rules |
| `X \| None`, `Optional[X]` | the schema for `X`; the argument may be omitted |
| `Literal["a", "b"]` | an `enum`, typed when every value has the same type |
| anything else | `string` |

A parameter without a default is required, and one with a default records it as `default`. `@tool` schemas set `"additionalProperties": false`.

## Tool

The base class. Subclass it for tools that keep state or whose schema comes from somewhere else, and set the class attributes.

| Attribute | Default | Meaning |
| --- | --- | --- |
| `name` | required | 1 to 64 letters, digits, `_` or `-`. |
| `description` | required | What the model is told the tool does. |
| `parameters` | required | A JSON Schema object (`"type": "object"`). |
| `timeout` | `None` | As for `@tool`. |
| `parallel_safe` | `True` | As for `@tool`. |
| `max_output_chars` | `None` | As for `@tool`. |
| `validate_arguments` | `True` | As for `@tool`. |

| Method | Meaning |
| --- | --- |
| `async forward(**kwargs) -> Any` | Runs the tool. Override it. The result is turned into a string with `str()`. |
| `async call(arguments: dict[str, Any]) -> Any` | Validates, then calls `forward`. The loop calls this. Raises `ToolCallError` when `arguments` isn't a dict or doesn't fit the schema. |
| `validate(arguments: dict[str, Any]) -> None` | Raises `ToolCallError` if the arguments don't fit `parameters`. Does nothing when `validate_arguments` is `False`. |
| `definition` (property) | A `ToolDefinition(name, description, parameters)`, what adapters send to the model. |

A tool's name and schema are checked when it's registered, by `Agent(tools=...)` or `session.add_tools`: an invalid name or a schema whose `type` isn't `"object"` raises `ValueError`.

### What validation checks

Validation covers a subset of JSON Schema: `required`, `type` (a name or a list of names, where `"null"` matches `None`), `enum`, and unknown keys when `additionalProperties` is `false`. `bool` doesn't count as `integer` or `number`. Keywords outside the subset, such as `anyOf`, `$ref`, `format` and nested object rules, are ignored, so a call the full schema allows is never refused.

## ToolCallError

`class ToolCallError(AgentlingError)`. Raised by validation, and tools may raise it themselves. The loop shows its message to the model as the tool's result, with a hint to fix the arguments, even when `redact_errors` is on. It never reaches your code from a run.

## final_answer

Every agent has a built-in `final_answer(answer: str)` tool. A successful call ends the run with `answer`. A reply with no tool calls also ends the run. The name is reserved: a tool of your own can't use it.

## Example

```python
from typing import Literal

from agentling import ToolCallError, tool


@tool(timeout=5)
def convert(value: float, unit: Literal["c", "f"] = "c") -> str:
    """Convert a temperature.

    Args:
        value: The temperature to convert.
        unit: The unit to convert to.
    """
    return f"{value * 9 / 5 + 32:.1f}F" if unit == "f" else f"{(value - 32) * 5 / 9:.1f}C"


print(convert.definition.name, convert.timeout)
print(convert.parameters["properties"]["unit"])
print(convert.parameters["required"])
print(await convert.call({"value": 100, "unit": "f"}))

try:
    await convert.call({"value": "hot"})
except ToolCallError as exc:
    print(exc)
```

Output:

```text
convert 5
{'type': 'string', 'enum': ['c', 'f'], 'description': 'The unit to convert to.', 'default': 'c'}
['value']
212.0F
Tool 'convert' argument 'value' expects number, got str
```
