---
title: What Agentling is
slug: introduction
description: An agent engine for Python. What you bring, what it runs, and what it leaves to you.
order: 1
metaTitle: "What Agentling is: an agent engine for Python"
metaDescription: "Agentling runs the tool-calling loop for you: you bring the model, the tools and the app around it. What you get, what it isn't, and where to start."
---

Agentling is an agent engine for Python. An engine runs the loop at the centre of an agent: it sends the conversation to a model, runs the tools the model asks for, records what happened, and repeats until the model answers. You bring the model (any object with a `stream()` method), the tools (plain Python functions) and the harness, which is everything you build around the engine: the process that hosts it, approvals, the UI. In return you get the parts of the loop that are tedious to get right yourself: retries, interruption, error recovery, memory and a stream of events.

[The loop is one file.](https://github.com/lunarstack-co/agentling/blob/v0.2.0/src/agentling/agent.py) You can read it before you decide to depend on it.

## You bring, Agentling brings

| You bring | Agentling brings |
| --- | --- |
| A model adapter: one class with a `stream(messages, tools)` method. Copy one of the three reference adapters or write your own. | The loop: model turn, tool calls, results back to the model, until it answers. |
| Tools: Python functions with type hints and a docstring. | The JSON Schema for each tool, argument checks, and concurrent tool calls. |
| The harness: your CLI, web server, desktop app or job runner. | Typed memory you can save to JSON and load again, and events you can stream to a UI. |
| Your policy: what needs approval, what to log, when to stop. | Hooks for it: step callbacks, `interrupt()`, `resume()` and a retry policy. |

## What you get over your own loop

A first agent loop fits on one screen. It stops fitting once the model misbehaves. Agentling handles these cases for you:

- **Retries that don't repeat tool calls.** A model turn that fails before sending anything is retried with backoff. A turn that already produced output is never replayed, so no tool runs twice.
- **Interrupt and resume.** `session.interrupt()` stops a run at the next safe point and keeps its memory; `session.resume()` carries on from there.
- **Truncated output detected.** When the model hits its output limit halfway through a tool call, you get `ModelOutputTruncatedError` instead of a confusing parse error.
- **Tool errors fed back as observations.** A tool that raises, times out or gets bad arguments doesn't crash the run. The model sees the error as the tool's result and can try something else.
- **Streamed events.** Every text chunk, tool call, tool result and finished step arrives as a typed event, in a fixed order.
- **A conformance checker for adapters.** `agentling.testing.check_model` runs your model adapter through a fixed script and tells you which of the contract's rules it breaks.

<figure class="not-prose my-8">
<svg role="img" aria-label="Your harness sits on top of the Agentling loop. The loop runs model turns and tool calls, records memory and streams events. Your model adapter and your tools sit underneath it." viewBox="0 0 720 360" width="100%" xmlns="http://www.w3.org/2000/svg" style="font-family: var(--font-sans); max-width: 720px">
<rect x="1" y="1" width="718" height="88" rx="10" style="fill: var(--bg-raised); stroke: var(--border-default)"/>
<text x="24" y="34" style="fill: var(--fg); font-size: 16px; font-weight: 600">Your harness</text>
<text x="24" y="62" style="fill: var(--fg-secondary); font-size: 14px">the process that hosts it, approvals, the UI, your server</text>
<line x1="360" y1="90" x2="360" y2="128" style="stroke: var(--border-default); stroke-width: 1.5"/>
<rect x="1" y="128" width="718" height="104" rx="10" style="fill: var(--accent-subtle); stroke: var(--accent)"/>
<text x="24" y="160" style="fill: var(--fg); font-size: 16px; font-weight: 600">Agentling: the loop</text>
<text x="24" y="190" style="fill: var(--fg-secondary); font-size: 14px">model turn, then tool calls, repeated until the model answers</text>
<text x="24" y="214" style="fill: var(--fg-secondary); font-size: 14px">typed memory you can save, events you can stream, retries and interrupts</text>
<line x1="180" y1="232" x2="180" y2="270" style="stroke: var(--border-default); stroke-width: 1.5"/>
<line x1="540" y1="232" x2="540" y2="270" style="stroke: var(--border-default); stroke-width: 1.5"/>
<rect x="1" y="270" width="350" height="88" rx="10" style="fill: var(--bg-raised); stroke: var(--border-default)"/>
<text x="24" y="304" style="fill: var(--fg); font-size: 16px; font-weight: 600">Your model adapter</text>
<text x="24" y="332" style="fill: var(--fg-secondary); font-size: 14px">any object with a stream() method</text>
<rect x="369" y="270" width="350" height="88" rx="10" style="fill: var(--bg-raised); stroke: var(--border-default)"/>
<text x="392" y="304" style="fill: var(--fg); font-size: 16px; font-weight: 600">Your tools</text>
<text x="392" y="332" style="fill: var(--fg-secondary); font-size: 14px">plain Python functions</text>
</svg>
</figure>

## What it is not

- **Not a model provider.** Agentling ships no adapters in the package. The [reference adapters](https://github.com/lunarstack-co/agentling/tree/v0.2.0/examples/providers) for OpenAI-compatible servers, Anthropic and Ollama are files you copy into your app.
- **Not a sandbox or an approval system.** Tools run as ordinary Python in your process. Deciding what a tool may do, and asking a person first, belongs in your harness.
- **Not a tracing backend.** The event stream and step callbacks give you the data; sending it to a tracer is up to you.
- **Not an orchestration graph.** There is one loop per session. If you need several agents, run several sessions and connect them in your own code.

## Built with it

[Aldwin](https://github.com/lunarstack-co/aldwin), a local personal assistant, uses Agentling as its engine. Its [`core/agent.py`](https://github.com/lunarstack-co/aldwin/blob/main/src/aldwin/core/agent.py) builds the agent, and everything else in Aldwin (approvals, the terminal UI, connectors) is harness. Aldwin's move to Agentling 0.2.0 is in progress, so that file may still use the 0.1 API.

## Start the tutorial

The tutorial builds one small program chapter by chapter, from a first agent that needs no API key to a harness of your own. [Start with your first agent](/docs/getting-started/quickstart), or [install Agentling](/docs/getting-started/installation) first.
