---
title: The Agent Loop
slug: agent-loop
description: One async generator drives every run, one iteration at a time.
order: 1
metaTitle: "The agent loop: one generator drives every run"
metaDescription: "How one generator runs each iteration: render the prompt, stream the model, run tool calls, record the step, and stop at a final answer or the step limit."
---

The whole framework hangs off a single async generator, `AgentSession._run_stream`. `run()` is a thin dispatcher: in streaming mode it hands back that generator, and in blocking mode it drains the generator and returns the final answer. There is no second implementation to keep in sync.

## One iteration is one step

Each iteration of the generator is a step. A step streams one model turn, runs whatever tools the model asked for, records the outcome, and checks whether the run is done.

```
1. interrupt requested?  -> yield FinalEvent, stop (resumable)
2. Memory.to_messages(instructions)  -> the full prompt
3. Model.stream(messages, tools)  -> Delta stream
     each text chunk is yielded as a TextDelta
     agglomerate_deltas() rebuilds one ChatMessage
4. no tool calls?  -> that text is the answer; finish
5. for each tool call: yield ToolCallEvent
6. execute tools (concurrently by default) -> ToolResults
     a raised exception becomes an error observation
     an exact repeat of last step's calls gets a nudge
7. yield ToolResultEvent per result; record an ActionStep
8. final_answer called?  -> finish with FinalEvent
```

If the step limit is reached, the loop asks once for a tool-free answer, then finishes.

## How a run ends

The loop ends in one of three ways:

- The model calls the built-in `final_answer` tool.
- The model replies with plain text and no tool calls.
- The step limit is hit, and the loop asks for one last tool-free answer.

### Forgiving termination

Not every model reliably calls `final_answer`. If the model replies with plain text and no tool calls, agentling treats that text as the answer and ends the run. Explicit `final_answer` calls and plain-text replies both work.

### Loop detection

If a step's tool calls are an exact repeat of the previous step's, with the same names and the same arguments, the loop appends a short nudge to the observations telling the model it already made that call and got the same result. This helps the model break out of a stuck cycle without a hard failure.

## Blocking and streaming share the loop

```python
# streaming: consume events as they happen
async for event in agent.run("Summarize this.", stream=True):
    ...

# blocking: the same generator, drained for you
answer = await agent.run("Summarize this.")
```

Because both modes run the exact same code path, anything you observe in the event stream is exactly what happened in a blocking run. See [Streaming Events](/docs/core-concepts/streaming-events) for every event type, [Memory](/docs/core-concepts/memory) for how steps are recorded, and the [Agent API](/docs/reference/agent-api) for the knobs that shape the loop, such as `max_steps` and `parallel_tools`.
