---
title: Design decisions
slug: design-decisions
description: The choices behind Agentling, what each one costs, and what we rejected.
order: 3
metaTitle: "Design decisions behind Agentling"
metaDescription: "Why Agentling is an engine with no bundled providers, typed memory, one code path, loop-owned retries and copy-paste adapters, and what each choice costs."
---

Each section below states a choice, the reason for it, and what it costs. If a cost matters more to you than the benefit, Agentling may not be the right fit.

## An engine, not a platform

Agentling runs the loop and stops there. The code around the loop, which we call the harness (the process that hosts it, approvals, the UI, your server), is yours. We chose this because the harness is where products differ, and a library that owns it has to guess.

The cost: you write the harness. Agentling gives you the events, the session controls and the memory to build it with, and the [tutorial](/docs/tutorial/build-a-harness) builds a small one, but there's no app server, no UI and no approval flow in the box.

## No bundled model providers

Agentling 0.1 shipped an OpenAI client. 0.2 ships none. A model is any object with a `stream()` method that follows [the model contract](/docs/concepts/the-model-contract), and `check_model` proves an adapter follows it. Reference adapters for OpenAI-compatible servers, Anthropic and Ollama live in the repository's `examples/providers/`, to copy.

We chose copy-paste files over installable adapters for three reasons. Vendor APIs change on their own schedule, and a copied file changes when you choose to. Every app wants something slightly different from its client: timeouts, proxies, extra request fields. And the package stays at one runtime dependency, `pyyaml`.

The cost: you own a few hundred lines of HTTP code per backend, and you update it yourself when the vendor changes. A recorded fixture and `check_model` in your tests tell you when it breaks.

## Types that belong to no vendor

Messages, tool calls, tool definitions and usage are Agentling's own dataclasses. Only an adapter knows a backend's wire format. That keeps the loop, memory and your code the same whichever model you run, and lets you switch models by changing one constructor.

The cost: anything a backend offers beyond the common shape needs a home. `provider_data` holds what an adapter must send back on a later turn, and `extra_body` on the reference adapters passes request fields through.

## Typed steps, not a list of messages

A run is recorded as `TaskStep`, `ActionStep` and `FinalStep` objects. Steps keep what a message list loses: which tool results belong to which call, usage and duration per step, and whether the run finished. They render back into messages for each model call and save to JSON.

The cost: you work with steps, not the raw messages, and a format change needs a version. Memory is versioned, and 0.2 still reads 0.1's format.

## One code path for blocking and streaming

`run()` and `run(stream=True)` run the same async generator; blocking mode drains it. We chose this so the events you stream are exactly what a blocking run did, with no second implementation to drift.

The cost: Agentling is async only. Call it from async code or with `asyncio.run`.

## The loop owns retries

Adapters never retry. The loop retries a failed model turn under one `RetryPolicy`, and only when the turn failed before its first chunk. Once text has streamed, retrying would show it twice; tools only run after a turn completes, so a retry never runs a tool twice.

The cost: a failure partway through a stream isn't retried. It's raised, and the run can be resumed from memory.

## Failures go to the model when the model can fix them

A tool that raises, a bad argument, a timeout or an unknown tool name becomes an error result the model reads, with a hint, and the run carries on. A tool call that can't be parsed gets a correction and another try. A tool call cut off by the model's output limit doesn't, because asking again can't help, so the loop raises `ModelOutputTruncatedError`.

The cost: a run can make more model calls than `max_steps` suggests, up to `max_steps * 3 + 1`, because corrections don't count as steps.

## Plain text ends a run

Not every model calls a "finish" tool reliably. A reply with no tool calls is the answer, and `final_answer` is there for models and prompts that prefer to finish explicitly. Both work.

## Skills load on demand

A skill is a folder with a `SKILL.md`. The model sees only its name and description until it asks for the full instructions with `load_skill`. Some call this progressive disclosure; the point is that a large skill library costs a few lines of prompt until a skill is used.

The cost: a skill can't shape the model's first turn, because the model hasn't loaded it yet.

## Configuration is shared, state is not

An `Agent` holds configuration and no per-run state, so one agent serves many concurrent runs. Each `AgentSession` has its own memory, interrupt flag and tool set, and runs one task at a time. Calling `run()` on a busy session raises `RuntimeError` instead of corrupting memory.

## Testing is part of the package

`agentling.testing` ships `ScriptedModel`, which replays scripted turns so an agent runs with no network and no key, and `check_model`. We put them in the package, as pydantic-ai does with its test models, because every app built on Agentling needs them, and test doubles copied from one test file to the next drift apart.

## What we left out

There's no tracing backend (step callbacks and events are the hooks), no sandbox (tools are your code; see [Security and trust](/docs/concepts/security-and-trust)), no automatic context summarisation (pass a `context_manager`) and no graph of agents (run several sessions). Each is a decision about the harness, and we'd rather you make it.

The loop that implements all of this is one file, [`agent.py`](https://github.com/lunarstack-co/agentling/blob/v0.2.0/src/agentling/agent.py). Reading it is the fastest way to check any claim on this page.
