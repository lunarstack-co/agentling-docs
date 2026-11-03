---
title: Trim the context window
slug: trim-context
description: Keep long conversations within the model's context window with a context_manager.
order: 6
metaTitle: "Trim the context window in Agentling"
metaDescription: "Pass a context_manager to Agent to trim or summarise the messages before every model call, without changing what memory saves."
---

Agentling sends the whole conversation on every model call. A long run eventually outgrows the model's context window, and the backend rejects it (`ModelContextLengthError`) or, on some local servers, silently drops the start. Agentling doesn't trim for you; pass a `context_manager`.

## Pass a context manager

`Agent(context_manager=...)` takes a function from a list of `ChatMessage`s to a list of `ChatMessage`s. The loop calls it before every model call with the full list, system prompt first, and sends whatever it returns. Memory is untouched: the trimmed list is only what this call sees, and `dump_json()` still saves everything.

Cut on exchange boundaries. An assistant message with tool calls must stay with the tool results that answer it, or most backends reject the request. Cutting just before a user message is always safe. Count only the user's own turns: the loop also sends two notes as user messages, a correction after an unparseable tool call and a final "Step limit reached" request, and counting those could cut away the task they refer to.

```python
import asyncio

from agentling import Agent, ChatMessage
from agentling.testing import ScriptedModel


# The loop's own notes to the model, sent with the user role.
LOOP_NOTES = ("Your previous response could not be parsed:", "Step limit reached.")


def keep_last_exchanges(count: int):
    """Keep the system prompt and the last `count` user turns with their replies."""

    def trim(messages: list[ChatMessage]) -> list[ChatMessage]:
        system, rest = messages[:1], messages[1:]
        starts = [
            index
            for index, message in enumerate(rest)
            if message.role == "user" and not message.content.startswith(LOOP_NOTES)
        ]
        if len(starts) <= count:
            return messages
        return system + rest[starts[-count]:]

    return trim


model = ScriptedModel([ChatMessage("assistant", f"Answer {n}.") for n in range(1, 5)])
agent = Agent(model=model, context_manager=keep_last_exchanges(2))


async def main() -> None:
    session = agent.start()
    for n in range(1, 5):
        await session.run(f"Question {n}?", reset=False)

    print("sent on each call:", [len(call) for call in model.calls])
    print("last call:", [message.content for message in model.calls[-1]][1:])
    print("steps in memory:", len(session.memory.steps))


asyncio.run(main())
```

```text
sent on each call: [2, 4, 4, 4]
last call: ['Question 3?', 'Answer 3.', 'Question 4?']
steps in memory: 8
```

From the third call on, the model sees the system prompt and the last two questions, while memory keeps all eight steps.

## Things to know

- **The system prompt is first.** Keep `messages[0]` unless you mean to replace it; that's where your instructions and the skill catalog live.
- **It runs on every call,** including the correction a malformed tool call triggers and the forced answer at the step limit. Correction notes are the last user messages, so a trim that keeps the end keeps them.
- **It's synchronous.** To summarise old turns with a model, do that between runs and replace the memory's steps, or keep a summary in your own state and splice it in as a message here.
- **Count tokens, not messages,** if your backend tells you the limit. A message count is a rough proxy, and one large tool result can still overflow. Cap tool output with `max_tool_output_chars` on the agent or `max_output_chars` on a tool.

For where this fits in the loop, see [The agent loop](/docs/concepts/the-agent-loop).
