---
title: Dynamic tools and MCP
slug: dynamic-tools-and-mcp
description: Add and remove tools on a running session, and wrap tools from an MCP server as agentling tools.
order: 6
---

Some tools aren't known when you build the agent. A user connects an app halfway through a conversation, a server changes the tools it offers, or a plugin loads late. agentling lets a running session gain and lose tools, and it accepts tools whose JSON Schema came from somewhere else.

## Adding and removing tools

Every session has its own tool set. Change it with `add_tools` and `remove_tools`:

```python
session = agent.start()
await session.run("What's on my calendar?")

session.add_tools([list_events, create_event])
await session.run("Book lunch with Ada on Friday.", reset=False)

session.remove_tools(["create_event"])
```

The model sees a change from its next call. That includes a run that is already going: if a step callback or another task adds a tool after step one, the model can use it in step two.

Both methods are all or nothing. If any tool in the batch has a bad name, a non-object schema, or a name that is already taken, nothing changes and you get a `ValueError`. Pass `replace=True` to swap in a new definition for a name you already added, for example when a server sends an updated schema.

If the model calls a tool you removed, it gets an unknown-tool observation and carries on. Saved memory that mentions a removed tool still loads and continues normally.

See the [Agent API](/docs/reference/agent-api) for the exact rules, and `examples/cli_dynamic_tools.py` for a runnable demo.

## Tools from someone else's schema

A tool from an MCP server, an OpenAPI spec or a plugin arrives as a name, a description and a JSON Schema. Subclass `Tool` and set those three yourself. agentling's argument checks handle real-world schemas: union types such as `["string", "null"]`, missing `properties`, and open objects. Keywords it doesn't implement are left alone rather than rejected. See [Tools](/docs/core-concepts/tools) for the full list.

When the other side validates arguments anyway, set `validate_arguments = False` so the local check never refuses a call the server would accept.

## Recipe: an MCP bridge

agentling has no MCP dependency. This recipe uses the official [MCP Python SDK](https://pypi.org/project/mcp/) (`pip install "mcp>=2.3,<3"`) in your own code to wrap each tool on an MCP server as an agentling `Tool`:

```python
import hashlib
import re
from typing import Any

from mcp import Client

from agentling import Agent, OpenAIModel, Tool


def safe_name(prefix: str, name: str) -> str:
    full = re.sub(r"[^A-Za-z0-9_-]", "_", f"{prefix}__{name}")
    if len(full) <= 64:
        return full
    return f"{full[:55]}_{hashlib.sha256(full.encode()).hexdigest()[:8]}"


class McpTool(Tool):
    """One tool on an MCP server, callable from agentling."""

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
        session = Agent(model=OpenAIModel("gpt-4o-mini")).start()
        session.add_tools(McpTool(client, tool, "example") for tool in listed.tools)

        print(await session.run("Use the example server to answer this."))
```

A few things to handle in real use:

- **Names.** `safe_name` keeps tool names within agentling's rules (letters, digits, `_` and `-`, up to 64 characters) and prefixes them with the server name so two servers can't collide.
- **Schemas.** If a server's `input_schema` lacks `"type": "object"`, wrap it in `{"type": "object", "properties": {}}`, or registration fails.
- **Changing tool lists.** When a server reports that its tools changed, list them again and call `add_tools(..., replace=True)` for new or updated tools and `remove_tools(...)` for ones that disappeared.
- **Errors and results.** Raising inside `forward` turns into an error observation the model can recover from. Non-text content, such as images, needs your own handling. Newer servers may also ask for more input mid-call; see the SDK docs.
- **Trust.** A tool's description and output come from the server. Treat them as untrusted input, and put anything that can change data behind your own approval step.
