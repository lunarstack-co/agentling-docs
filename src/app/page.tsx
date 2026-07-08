import {
  ArrowRight,
  BookOpenText,
  GitMerge,
  HeartPulse,
  Layers,
  Radio,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { GithubIcon } from "@/components/icons/github";

import { CodeTabs } from "@/components/home/code-tabs";
import { Hero } from "@/components/home/hero";
import { JsonLd } from "@/components/json-ld";
import { Markdown } from "@/components/markdown";
import { Reveal } from "@/components/reveal";
import { pageMetadata } from "@/lib/seo";
import { GITHUB_URL, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const revalidate = 300;

export const metadata = {
  ...pageMetadata({
    title: `${SITE_NAME} · The agent framework you can read in one sitting`,
    description: SITE_TAGLINE,
    path: "/",
  }),
  // Opt out of the layout's "%s · agentling" template on the homepage.
  title: { absolute: `${SITE_NAME} · The agent framework you can read in one sitting` },
};

const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_TAGLINE,
    },
    {
      "@type": "SoftwareSourceCode",
      name: SITE_NAME,
      description: SITE_TAGLINE,
      url: SITE_URL,
      codeRepository: GITHUB_URL,
      programmingLanguage: "Python",
      runtimePlatform: "Python 3.11+",
      license: "https://opensource.org/license/mit",
      author: { "@type": "Person", name: "Folarin Akinloye" },
    },
  ],
};

const STATS = [
  { value: "~800", label: "lines of source" },
  { value: "2", label: "runtime dependencies" },
  { value: "100%", label: "typed, mypy checked" },
  { value: "1", label: "loop for everything" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Async first",
    description:
      "The loop, tools, and model calls are all async. Tool calls in a single step run concurrently by default.",
  },
  {
    icon: GitMerge,
    title: "One code path",
    description:
      "Blocking and streaming share the exact same loop. There is a single async generator; blocking mode just drains it.",
  },
  {
    icon: Layers,
    title: "Typed memory",
    description:
      "A run is a list of typed steps that serialize to JSON, so persistence, replay, and multi-turn continuation come for free.",
  },
  {
    icon: Radio,
    title: "Streaming events",
    description:
      "Five frozen event types narrate every run: text deltas, tool calls, results, recorded steps, and the final answer.",
  },
  {
    icon: HeartPulse,
    title: "Self-healing",
    description:
      "A tool that raises becomes an observation the model can recover from, not a crash. Stuck loops get a nudge.",
  },
  {
    icon: BookOpenText,
    title: "Progressive skills",
    description:
      "Drop a SKILL.md folder in and the model sees only its name until it decides to load it. Big skill libraries stay cheap.",
  },
];

const LOOP_STEPS = [
  { title: "Render the prompt", detail: "Typed memory becomes model messages." },
  { title: "Stream the model turn", detail: "Text deltas surface as they arrive." },
  { title: "Run the tool calls", detail: "Concurrently, with schema validation." },
  { title: "Record the step", detail: "Usage, duration, and results, all typed." },
  { title: "Check for an answer", detail: "final_answer, plain text, or step limit." },
];

const EVENTS = [
  { name: "TextDelta", meaning: "a chunk of streamed text" },
  { name: "ToolCallEvent", meaning: "a tool is about to run" },
  { name: "ToolResultEvent", meaning: "a tool finished" },
  { name: "StepEvent", meaning: "a step hit memory" },
  { name: "FinalEvent", meaning: "the run is done" },
];

const BLOCKING_SNIPPET = `\`\`\`python
import asyncio

from agentling import Agent, OpenAIModel, tool


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city.

    Args:
        city: The city to look up.
    """
    return f"It is 22C and sunny in {city}."


async def main() -> None:
    agent = Agent(model=OpenAIModel("gpt-4o-mini"), tools=[get_weather])
    print(await agent.run("What's the weather in Paris?"))


asyncio.run(main())
\`\`\``;

const STREAMING_SNIPPET = `\`\`\`python
from agentling import FinalEvent, TextDelta, ToolCallEvent

async for event in agent.run("Summarize this.", stream=True):
    if isinstance(event, TextDelta):
        print(event.text, end="", flush=True)
    elif isinstance(event, ToolCallEvent):
        print(f"\\n[calling {event.tool_call.name}]")
    elif isinstance(event, FinalEvent):
        print(f"\\nDone: {event.answer}")
\`\`\``;

const SKILLS_SNIPPET = `\`\`\`python
agent = Agent(
    model=OpenAIModel("gpt-4o-mini"),
    tools=[read_file],
    skills=["skills/code-reviewer"],
)

# The model sees only the skill catalog until it
# decides to call load_skill("code-reviewer").
print(await agent.run("Review src/agentling/agent.py"))
\`\`\``;

const MEMORY_SNIPPET = `\`\`\`python
session = agent.start()
await session.run("First question")

saved = session.memory.dump_json()

# ...later, even in another process...
restored = agent.start()
restored.memory = Memory.load_json(saved)
await restored.run("A follow-up", reset=False)
\`\`\``;

export default function HomePage() {
  return (
    <>
      <JsonLd data={HOME_JSON_LD} />
      <Hero />

      {/* Stats strip */}
      <section aria-label="Project facts" className="border-y border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <p className="font-mono text-2xl font-bold text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <p className="font-mono text-xs font-semibold tracking-wider text-accent uppercase">
            Why agentling
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything is a thin layer on one readable loop
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            An agent is a loop that turns a model, some tools, and a memory of
            what happened into more actions, until it has an answer. agentling
            keeps that loop legible and layers everything else on top.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={0.06 * (index % 3)}>
              <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-colors duration-150 hover:border-border-strong">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft">
                  <feature.icon className="size-5 text-accent" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The loop + code tour */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:py-28">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider text-accent uppercase">
              The loop
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              One iteration, one step
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Each step streams a model turn, runs the tools it asked for,
              records the outcome, and checks whether the run is done. Blocking
              and streaming, persistence and resume, skills and self-healing
              all hang off this one generator.
            </p>
            <ol className="mt-8 space-y-4">
              {LOOP_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card font-mono text-xs font-semibold text-accent">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {step.title}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {step.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={0.1}>
            <CodeTabs
              tabs={[
                {
                  label: "Blocking",
                  panel: <Markdown source={BLOCKING_SNIPPET} />,
                },
                {
                  label: "Streaming",
                  panel: <Markdown source={STREAMING_SNIPPET} />,
                },
                { label: "Skills", panel: <Markdown source={SKILLS_SNIPPET} /> },
                { label: "Memory", panel: <Markdown source={MEMORY_SNIPPET} /> },
              ]}
            />
          </Reveal>
        </div>
      </section>

      {/* Events strip */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <Reveal>
            <div className="text-center">
              <p className="font-mono text-xs font-semibold tracking-wider text-accent uppercase">
                Observability
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Every run narrates itself
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Five frozen event types describe everything an agent does. Feed
                them to a terminal, a UI, a logger, or a metrics store; the
                stream and the durable memory can never disagree.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {EVENTS.map((event, index) => (
                <span key={event.name} className="flex items-center gap-3">
                  <span className="rounded-xl border border-border bg-card px-4 py-3 text-center">
                    <span className="block font-mono text-sm font-semibold text-foreground">
                      {event.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {event.meaning}
                    </span>
                  </span>
                  {index < EVENTS.length - 1 && (
                    <ArrowRight className="size-4 text-faint" aria-hidden />
                  )}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-24 text-center sm:px-6">
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-72 w-2xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]"
          />
          <Reveal className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Read the source. All of it. Tonight.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              No metaclasses, no plugin registry, no DSL. Install it, read the
              loop, and know exactly what your agent will do.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/docs/getting-started/introduction"
                className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-opacity duration-150 hover:opacity-90"
              >
                Read the docs
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors duration-150 hover:border-border-strong"
              >
                <GithubIcon className="size-4" aria-hidden />
                Star on GitHub
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
