---
title: Use tools from a JSON Schema or MCP
slug: tools-from-a-schema-or-mcp
description: Wrap tools whose schema comes from elsewhere, and add or remove tools on a running session.
order: 3
metaTitle: "Use tools from a JSON Schema or MCP"
metaDescription: "Subclass Tool for a tool defined by a JSON Schema, change a session's tools with add_tools and remove_tools, and bridge an MCP server's tools."
---

`@tool` builds a schema from a Python function. A tool from an MCP server, an OpenAPI spec or a plugin arrives the other way round: a name, a description and a JSON Schema, with the code somewhere else. Subclass `Tool` for those.

## Subclass `Tool` with a schema

Set `name`, `description` and `parameters`, and implement `forward`, which receives the model's arguments as keyword arguments:

```python
import asyncio
from typing import Any

from agentling import Agent, ChatMessage, Tool, ToolCall
from agentling.testing import ScriptedModel

WEATHER_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "city": {"type": "string", "description": "The city to look up."},
        "units": {"type": ["string", "null"], "enum": ["c", "f", None]},
    },
    "required": ["city"],
}


class WeatherTool(Tool):
    def __init__(self) -> None:
        self.name = "get_weather"
        self.description = "Get the current weather for a city."
        self.parameters = WEATHER_SCHEMA

    async def forward(self, **kwargs: Any) -> str:
        units = kwargs.get("units") or "c"
        return f"{kwargs['city']}: 18 degrees {units.upper()}, light rain"


def call(call_id: str) -> ChatMessage:
    arguments = {"city": "Lagos", "units": None}
    return ChatMessage("assistant", tool_calls=[ToolCall(call_id, "get_weather", arguments)])


model = ScriptedModel(
    [
        call("c1"),
        ChatMessage("assistant", "18 degrees and light rain in Lagos."),
        call("c2"),
        ChatMessage("assistant", "I can't check the weather any more."),
    ]
)


async def main() -> None:
    session = Agent(model=model).start()

    session.add_tools([WeatherTool()])
    print(await session.run("What's the weather in Lagos?"))

    session.remove_tools(["get_weather"])
    print(await session.run("And now?", reset=False))
    print(session.memory.steps[-2].tool_results[0].content)


asyncio.run(main())
```

```text
18 degrees and light rain in Lagos.
I can't check the weather any more.
Unknown tool 'get_weather'. Available: ['final_answer']
```

The last line is the error result recorded for the second call. The model sees it with a hint to try a different approach.

Before each call, Agentling checks the arguments against a subset of JSON Schema: types, including unions such as `["string", "null"]`, `required`, `enum`, and `additionalProperties: false`. Keywords outside that subset, such as `anyOf`, `$ref` or `format`, are ignored, so the check never refuses a call the full schema allows. A bad call reaches the model as an error result it can fix.

The `parameters` must be an object schema (`"type": "object"`) and the name must be letters, digits, `_` or `-`, up to 64 characters, or the tool is refused when you add it.

## Turn off the local check

When something else validates the arguments, such as a remote server that checks them against its own schema, set `validate_arguments = False` on the class. Agentling then passes the arguments through untouched, and the remote side's error comes back to the model instead. For `@tool` functions, pass `@tool(validate_arguments=False)`.

## Change tools on a running session

Each session has its own copy of the agent's tools. `session.add_tools(tools)` and `session.remove_tools(names)` change that copy, and the model sees the change from its next call, including partway through a run.

Both are all or nothing. If any tool has a bad name or schema, uses a reserved name (`final_answer`, or `load_skill` when the agent has skills), or takes a name already in use, nothing changes and you get a `ValueError`. Pass `replace=True` to `add_tools` to swap in a new definition under an existing name, for example when a server sends an updated schema.

A model that calls a removed tool gets an unknown-tool result, as above, and carries on. Saved memory that mentions a removed tool still loads.

## Bridge an MCP server

Agentling has no MCP dependency. This recipe uses the official [MCP Python SDK](https://pypi.org/project/mcp/) in your own code to wrap each tool on a server as a `Tool`:

```python
# not executed: needs the mcp package and an MCP server
import asyncio
import hashlib
import re
from typing import Any

from mcp import Client

from agentling import Agent, Tool
from examples.providers.openai_chat import OpenAIChatModel


def safe_name(prefix: str, name: str) -> str:
    full = re.sub(r"[^A-Za-z0-9_-]", "_", f"{prefix}__{name}")
    if len(full) <= 64:
        return full
    return f"{full[:55]}_{hashlib.sha256(full.encode()).hexdigest()[:8]}"


class McpTool(Tool):
    # The server checks arguments against its own schema.
    validate_arguments = False

    def __init__(self, client: Client, remote: Any, prefix: str) -> None:
        self._client = client
        self._remote_name = remote.name
        self.name = safe_name(prefix, remote.name)
        self.description = remote.description or ""
        self.parameters = remote.input_schema

    async def forward(self, **kwargs: Any) -> str:
        result = await self._client.call_tool(self._remote_name, kwargs)
        text = "\n".join(item.text for item in result.content if item.type == "text")
        if result.is_error:
            raise RuntimeError(text)
        return text


async def main() -> None:
    async with Client("https://mcp.example.com/mcp") as client:
        listed = await client.list_tools()
        session = Agent(model=OpenAIChatModel("gpt-4o-mini")).start()
        session.add_tools(McpTool(client, tool, "example") for tool in listed.tools)
        print(await session.run("Use the example server to answer this."))


asyncio.run(main())
```

Things to handle in real use:

- **Names.** `safe_name` keeps names within Agentling's rules and prefixes them with the server, so two servers can't collide.
- **Schemas.** If a server's `input_schema` lacks `"type": "object"`, wrap it in `{"type": "object", "properties": {}}` or `add_tools` refuses it.
- **Changing tool lists.** When the server says its tools changed, list them again, then call `add_tools(..., replace=True)` for new or changed tools and `remove_tools(...)` for ones that went away.
- **Errors.** Raising inside `forward` becomes an error result the model can recover from. Non-text content, such as images, needs your own handling.
- **Trust.** A tool's description and output come from the server. Treat them as untrusted input, and put anything that changes data behind your own approval step. See [Security and trust](/docs/concepts/security-and-trust).

The [tools reference](/docs/reference/tools) lists every `Tool` attribute.
