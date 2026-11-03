---
title: agentling.testing
slug: testing
description: ScriptedModel for offline runs, check_model for adapters, and the fixture recorder.
order: 9
metaTitle: "agentling.testing reference"
metaDescription: "ScriptedModel, check_model and its eight rules, ConformanceReport, RecordingTransport, Exchange, and the fixture reader and writer."
---

`agentling.testing` runs agents with no network and checks model adapters against the contract. Import it by that name; it isn't re-exported from `agentling`. `ScriptedModel` and `check_model(live=True)` need nothing extra; recorded mode and `RecordingTransport` need `httpx` and raise `ImportError("... needs httpx: pip install httpx")` without it. For writing tests around an agent, see [Test your agent](/docs/tutorial/test-your-agent).

## ScriptedModel

`ScriptedModel(turns: Sequence[ScriptedTurn])`, where `ScriptedTurn` is `ChatMessage | Sequence[Delta] | Exception`. Each `stream()` call replays the next turn:

| Turn | What `stream()` does |
| --- | --- |
| `ChatMessage` | Streams it in pieces: one `Delta` with its content and reasoning, one per tool call, then one with its usage, `finish_reason` and `provider_data`. Pieces with nothing to carry are left out, and no `finish_reason` is invented. |
| sequence of `Delta`s | Yields them as given. |
| `Exception` | Raises it before yielding anything. |

| Attribute | Meaning |
| --- | --- |
| `calls` | `list[list[ChatMessage]]`: a copy of the messages each call received. |
| `tools` | `list[list[ToolDefinition]]`: a copy of the tools each call received. |

**Raises** `AssertionError("ScriptedModel has no more turns")` when called after the last turn, and `TypeError` for a `str` or `bytes` turn.

## check_model

```text
async check_model(
    factory: Callable[[httpx.AsyncBaseTransport | None], Model],
    *,
    recorded: str | Path | None = None,
    live: bool = False,
    expects_tool_calls: bool = True,
) -> ConformanceReport
```

Runs an adapter through a fixed script and reports which [contract rule](/docs/concepts/the-model-contract) it broke. Turn 1 asks for the word "pong" with no tools; turn 2 offers an `echo` tool with a required `text` string and asks the model to call it.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `factory` | required | Builds the adapter around a transport. In recorded mode it gets one that replays the fixture; with `live=True` it gets `None`. |
| `recorded` | `None` | A fixture path. Its exchanges are replayed in order. A third exchange adds a turn that must raise a `ModelError`. |
| `live` | `False` | `True` calls the real backend, or runs any model that ignores the transport. |
| `expects_tool_calls` | `True` | `False` skips rule 4, for a model that can't call tools. |

**Raises** `ValueError` unless exactly one of `recorded` or `live=True` is given, and `ValueError` for a fixture with fewer than two exchanges. A request beyond the end of the fixture fails rule 5.

### The rules

| Rule | Name | Fails when |
| --- | --- | --- |
| 1 | text reassembles | Turn 1 joins to empty content. |
| 2 | finish_reason once | A turn yields `finish_reason` zero times or more than once. |
| 3 | usage present | A turn yields no usage, or a count is negative or not an integer. |
| 4 | tool call reassembles | Turn 2 has no tool call, or its name or arguments can't be used. |
| 5 | only ModelError escapes | A turn raises anything that isn't a `ModelError`, or the third turn raises nothing. |
| 6 | inputs not mutated | The adapter changed the `messages` or `tools` it was given. |
| 7 | provider_data serialisable | `json.dumps` fails on a `provider_data`. |
| 8 | no empty Delta | A `Delta` carries no content, reasoning, tool call, usage or `finish_reason`. |

A turn that raises fails every rule that needed its output, with the reason `turn N raised <Type>: <message>`. Every other failure reason ends with `(turn N)`.

## ConformanceReport and RuleResult

`ConformanceReport(rules: tuple[RuleResult, ...], turns: tuple[ChatMessage | None, ...])`, frozen.

| Member | Meaning |
| --- | --- |
| `rules` | One `RuleResult` per rule, in order. |
| `turns` | The joined text turn and tool turn; `None` for a turn that raised or couldn't be joined. |
| `ok` | `True` when no rule failed. Skipped rules don't count. |
| `raise_for_failures()` | Raises `AssertionError` listing every failed rule, or returns `None`. |
| `str(report)` | One line per rule. |

`RuleResult(number: int, name: str, status: Literal["passed", "failed", "skipped"], reason: str = "")`, frozen. `str()` gives `rule N (name): passed`, `skipped`, or `failed: <reason>`.

## Recording fixtures

| Name | Meaning |
| --- | --- |
| `RecordingTransport(inner: httpx.AsyncBaseTransport \| None = None)` | An `httpx` transport that records every exchange in `exchanges: list[Exchange]`. Wraps `inner`, a real network transport by default. Each request asks for an unencoded body. Values of the `authorization`, `x-api-key` and `api-key` headers are replaced with `‹redacted›` before anything is stored; request bodies are recorded as sent, so read a fixture before committing it. |
| `Exchange(request: dict[str, Any], status: int, headers: dict[str, str], body_lines: list[str])` | One request and its response. `request` holds the method, URL, redacted headers and body (parsed JSON when possible). Joining `body_lines` with newlines gives the response body back exactly. |
| `write_fixture(path: str \| Path, exchanges: Iterable[Exchange]) -> None` | Writes one JSON object per line. |
| `read_fixture(path: str \| Path) -> list[Exchange]` | Reads a fixture. Raises `FileNotFoundError` for a missing file and `ValueError` naming the line for a line that isn't a valid exchange. |

[`examples/providers/record.py`](https://github.com/lunarstack-co/agentling/blob/v0.2.0/examples/providers/record.py) records a reference adapter against a live backend with these.

## Example

A `ScriptedModel` stands in for a conforming backend, then the OpenAI-compatible reference adapter replays a recorded fixture:

```python
from agentling import ChatMessage, ToolCall, Usage
from agentling.testing import ScriptedModel, check_model
from examples.providers.openai_chat import OpenAIChatModel

turns = [
    ChatMessage("assistant", "pong", usage=Usage(5, 1), finish_reason="stop"),
    ChatMessage(
        "assistant",
        tool_calls=[ToolCall("c1", "echo", {"text": "ping"})],
        usage=Usage(9, 4),
        finish_reason="tool_calls",
    ),
]
report = await check_model(lambda transport: ScriptedModel(turns), live=True)
print(report.ok)


def build(transport):
    return OpenAIChatModel("gpt-4o-mini", api_key="unused", transport=transport)


report = await check_model(build, recorded="tests/fixtures/openai_chat.jsonl")
print(report)
report.raise_for_failures()

broken = [ChatMessage("assistant", "pong", usage=Usage(5, 1)), turns[1]]
print(await check_model(lambda transport: ScriptedModel(broken), live=True))
```

Output:

```text
True
rule 1 (text reassembles): passed
rule 2 (finish_reason once): passed
rule 3 (usage present): passed
rule 4 (tool call reassembles): passed
rule 5 (only ModelError escapes): passed
rule 6 (inputs not mutated): passed
rule 7 (provider_data serialisable): passed
rule 8 (no empty Delta): passed
rule 1 (text reassembles): passed
rule 2 (finish_reason once): failed: finish_reason was never yielded (turn 1)
rule 3 (usage present): passed
rule 4 (tool call reassembles): passed
rule 5 (only ModelError escapes): passed
rule 6 (inputs not mutated): passed
rule 7 (provider_data serialisable): passed
rule 8 (no empty Delta): passed
```

Recording and reading a fixture, with a mock server standing in for the backend:

```python
import tempfile
from pathlib import Path

import httpx

from agentling.testing import RecordingTransport, read_fixture, write_fixture


def server(request: httpx.Request) -> httpx.Response:
    return httpx.Response(200, text='data: {"ok": true}\n\ndata: [DONE]')


recorder = RecordingTransport(httpx.MockTransport(server))
async with httpx.AsyncClient(transport=recorder) as client:
    await client.post("http://test/v1/chat", json={"q": 1}, headers={"authorization": "Bearer sk-1"})

path = Path(tempfile.mkdtemp()) / "fixture.jsonl"
write_fixture(path, recorder.exchanges)
(exchange,) = read_fixture(path)
print(exchange.status, exchange.request["headers"]["authorization"], exchange.request["body"])
print(exchange.body_lines)
```

Output:

```text
200 ‹redacted› {'q': 1}
['data: {"ok": true}', '', 'data: [DONE]']
```
