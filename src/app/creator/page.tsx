import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { getFileDates } from "@/lib/content/dates";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { AUTHOR, GITHUB_URL, PERSON_ID, PYPI_URL, SITE_URL } from "@/lib/site";

/**
 * Creator profile. Indexable on purpose and unlinked on purpose:
 *
 * - It returns 200, has a self-referencing canonical, and is listed in the
 *   sitemap (src/app/sitemap.ts), so search engines can find and index it.
 * - It is deliberately absent from the header, sidebar, footer, and the
 *   search index. Both search indexes are built from /content, and this is
 *   a code route, so nothing links here unless someone adds a link.
 * - It is a static page served identically to every visitor. There is no
 *   crawler-specific content and no conditional redirect.
 *
 * If you add an internal link to this page, that is a product decision,
 * not a bug fix. Every factual claim below is drawn from folarin.dev, the
 * GitHub profile, or the Agentling repository and docs.
 */

const PATH = "/creator";
const TITLE = "Folarin Akinloye - AI Engineer & Agentling Creator";
const DESCRIPTION =
  "Folarin Akinloye is an AI engineer building agentic systems and AI-powered products, and the creator of the open-source Agentling framework.";
const BLOG_URL = `${AUTHOR.url}/blog`;

export const metadata: Metadata = pageMetadata({
  kind: "page",
  title: TITLE,
  absoluteTitle: true,
  description: DESCRIPTION,
  path: PATH,
});

const WRITING = [
  {
    title: "The Reference Architecture for a Production AI App",
    href: `${AUTHOR.url}/blog/the-reference-architecture-for-a-production-ai-app`,
    note: "Why the model call is a small part of a production AI app, and what the surrounding components have to do.",
  },
  {
    title: "Skills vs MCP vs Tools vs Subagents: Stop Conflating Them",
    href: `${AUTHOR.url}/blog/skills-vs-mcp-vs-tools-vs-subagents`,
    note: "Four different ways to extend an agent, what each one is for, and how they fit together.",
  },
  {
    title: "Agent Memory: Short-Term vs Long-Term, and How to Wire It Up",
    href: `${AUTHOR.url}/blog/agent-memory-short-term-vs-long-term`,
    note: "The two kinds of memory an agent needs and how to implement each without overbuilding.",
  },
  {
    title: "Designing UX for a Confidently-Wrong Intern",
    href: `${AUTHOR.url}/blog/designing-ux-for-a-confidently-wrong-intern`,
    note: "Interface design for AI features that can be wrong or slow, unlike conventional software.",
  },
];

const PROFILES = [
  { label: "Website", href: AUTHOR.url, text: "folarin.dev" },
  { label: "Writing", href: BLOG_URL, text: "folarin.dev/blog" },
  { label: "GitHub", href: AUTHOR.github, text: "github.com/folathecoder" },
  { label: "LinkedIn", href: AUTHOR.linkedin, text: "linkedin.com/in/akinloye-folarin" },
];

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export default function CreatorPage() {
  const dates = getFileDates("src/app/creator/page.tsx");

  return (
    <div className="mx-auto w-full min-w-0 max-w-[760px] px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ProfilePage",
              "@id": `${SITE_URL}${PATH}#page`,
              url: absoluteUrl(PATH),
              name: TITLE,
              description: DESCRIPTION,
              dateCreated: dates.published,
              dateModified: dates.modified,
              inLanguage: "en",
              isPartOf: { "@id": `${SITE_URL}/#site` },
              mainEntity: { "@id": PERSON_ID },
            },
            {
              "@type": "Person",
              "@id": PERSON_ID,
              name: AUTHOR.name,
              url: AUTHOR.url,
              jobTitle: "AI Engineer",
              description:
                "AI engineer who builds agentic systems and AI-powered products, and the creator of Agentling, an open-source Python framework for building AI agents.",
              knowsAbout: [
                "Agentic AI systems",
                "AI product engineering",
                "Retrieval-augmented generation",
                "LLM evaluation",
                "Python",
                "TypeScript",
              ],
              sameAs: [AUTHOR.github, AUTHOR.linkedin, AUTHOR.url],
              mainEntityOfPage: { "@id": `${SITE_URL}${PATH}#page` },
            },
          ],
        }}
      />

      <p className="eyebrow">Creator</p>
      <h1 className="mt-3 text-balance text-h1 font-semibold tracking-[-0.02em] text-fg">
        Folarin Akinloye, AI Engineer and Creator of Agentling
      </h1>
      <p className="mt-3 text-lede text-fg-secondary">
        I build agentic systems and AI-powered products, and I created
        Agentling, an open-source Python framework for building AI agents.
      </p>

      <div className="prose mt-6 max-w-none border-t border-border-subtle pt-6">
        <p>
          My work sits where agent architectures, AI infrastructure, and
          product engineering meet. I design and build systems that reason
          through a task, call tools, retrieve what they need, coordinate the
          steps of a workflow, and behave predictably once real people depend
          on them. Agentling is the part of that work I released as open
          source: the loop, memory, and event model I kept wanting and could
          not find small enough to read in one sitting.
        </p>

        <h2 id="what-i-work-on">What I work on</h2>

        <h3>Agentic AI systems</h3>
        <p>
          I design agents and the workflows around them: tool-calling loops,
          multi-agent backends that route work by complexity and cost, and
          pipelines that carry a task through several steps without a person
          holding each one together. On the AI platform at Cuvama I built a
          tiered multi-agent backend in LangGraph that routes tasks across
          OpenAI, Anthropic, and Bedrock models by complexity, cost, and token
          budget. The interesting decisions are rarely about the model. They
          are about which tools an agent gets, how its subtasks are split and
          coordinated, and what happens when a step fails halfway through.
        </p>

        <h3>AI product engineering</h3>
        <p>
          A prototype only has to work once, in front of its author. A product
          has to work for people who did not build it, on inputs nobody
          predicted, inside an interface that stays honest about what the
          model is doing. I own that whole surface end to end: model and tool
          integration, backend services, the workflow design in between, and
          the interface on top. That has included streaming chat, live
          visualisation of tool calls and agent activity, progressive rendering
          over WebSockets, and plan-approval flows where an agent proposes a
          multi-step edit and a person reviews it, with versioning, before
          anything changes.
        </p>

        <h3>AI infrastructure and reliability</h3>
        <p>
          Retrieval, context management, evaluation, observability, and
          recovery are not finishing touches. They are what make a system
          usable at all. I have built version-aware retrieval with Agentic RAG
          on MongoDB Atlas Vector Search, replacing bulk context injection with
          typed tool calls, and I have wired LangSmith evaluation pipelines
          into GitHub Actions so that a regression in agent behaviour blocks a
          merge rather than reaching users. Reliability, predictable behaviour,
          and quality you can measure are the difference between a system that
          demos well and one a team will keep.
        </p>

        <h3>Working with startups</h3>
        <p>
          I work on practical AI problems in startup environments, where a
          small team has to turn a new capability into something useful without
          building more than the problem needs. That means working across
          product and engineering at once, making the architecture calls, and
          delivering the whole thing, from the data layer to the pixels. The
          judgement I bring is about what to build and what to leave out, not
          only how.
        </p>

        <h2 id="why-i-built-agentling">Why I built Agentling</h2>
        <p>
          Most agent frameworks hide the loop. When something goes wrong at
          three in the morning, that is exactly the part you need to read. I
          wanted a framework where the whole execution model fits in your head:
          one async generator drives every run, every step is a typed object,
          and every event the loop emits is one you can see. Agentling is that
          framework, built Python-first for asyncio, and kept small enough that
          the source is the documentation of last resort.
        </p>
        <ul>
          <li>
            <strong>Async, Python-first execution.</strong> The loop, the
            tools, and the model calls are all async. Tool calls within one
            step run concurrently by default, so an agent that needs three
            lookups does not wait three times.
          </li>
          <li>
            <strong>A ReAct-style loop with one code path.</strong> Blocking
            and streaming modes share the same generator, so what you observe
            in the stream is exactly what happened in a blocking run.
          </li>
          <li>
            <strong>Typed memory.</strong> A run is a list of typed steps, not
            a pile of message dictionaries. Steps render themselves into model
            messages and serialize to JSON, which is what makes persistence,
            replay, and resuming possible without extra machinery.
          </li>
          <li>
            <strong>Streaming events.</strong> A small set of typed events
            reports everything the loop does, which is what an interface
            needs to show progress honestly and what an operator needs to
            debug a run.
          </li>
          <li>
            <strong>Recoverable failures and resumable runs.</strong> A tool
            that raises becomes an observation the model can act on. Per-call
            timeouts, output truncation, and error redaction are built in. A
            run can be interrupted and resumed from the step where it paused.
          </li>
          <li>
            <strong>Provider abstraction.</strong> The built-in adapter speaks
            to any OpenAI-compatible endpoint, and the Model protocol is small
            enough to implement for a provider of your own.
          </li>
          <li>
            <strong>Runs without a key.</strong> The repository ships examples
            that run offline against a scripted model, so you can see failure
            recovery and memory persistence work before you configure a
            provider.
          </li>
        </ul>
        <p>
          <ExternalLink href={GITHUB_URL}>Source on GitHub</ExternalLink>,{" "}
          <a href="/docs/getting-started/introduction">documentation</a>,{" "}
          <a href="/docs/getting-started/installation">installation</a>,{" "}
          <ExternalLink href={`${GITHUB_URL}/tree/main/examples`}>examples</ExternalLink>, and{" "}
          <ExternalLink href={PYPI_URL}>the package on PyPI</ExternalLink>. MIT
          licensed, Python 3.11 or newer.
        </p>

        <h2 id="engineering-principles">Engineering principles</h2>
        <p>
          None of these are original. They are the rules I keep coming back to
          when a system is on the line.
        </p>
        <ul>
          <li>
            <strong>Agents should be useful, not just impressive.</strong>{" "}
            Design around a real task and an outcome you can measure, not
            around the demo.
          </li>
          <li>
            <strong>Reliability is part of the architecture.</strong> Failures,
            retries, observability, and recovery are designed in at the start,
            not patched on after the first incident.
          </li>
          <li>
            <strong>Evaluation matters.</strong> Agent behaviour is tested
            systematically and regressions are caught in CI, not discovered in
            a demo that happened to go well.
          </li>
          <li>
            <strong>Abstractions should solve real problems.</strong> A
            framework earns its abstractions by removing work, and it must
            never hide the execution details you need when something breaks.
          </li>
          <li>
            <strong>AI belongs in products.</strong> The model, the tools, the
            interface, the infrastructure, and the user&apos;s workflow are one
            system, and they are designed together.
          </li>
        </ul>

        <h2 id="selected-work">Selected AI engineering work</h2>
        <ul>
          <li>
            <strong>
              <ExternalLink href={GITHUB_URL}>Agentling</ExternalLink>
            </strong>
            . An async Python framework for tool-using agents with typed memory,
            streamed events, concurrent tool calls, recoverable failures, and
            resumable runs. The problem it addresses is execution you can read,
            replay, and trust.
          </li>
          <li>
            <strong>
              <ExternalLink href={`${BLOG_URL}`}>From Demo to Product</ExternalLink>
            </strong>
            . A written series on what it takes to turn an AI prototype into a
            product: architecture, unit economics, risk, quality ownership, and
            interface design. Selected pieces:
            <ul>
              {WRITING.map((item) => (
                <li key={item.href}>
                  <ExternalLink href={item.href}>{item.title}</ExternalLink>.{" "}
                  {item.note}
                </li>
              ))}
            </ul>
          </li>
        </ul>

        <h2 id="background">Professional background</h2>
        <p>
          I have been building software for nine years, the last two mostly on
          agent systems. Since 2024 I have been a Senior Product Engineer on
          the AI platform at Cuvama, where I own the frontend platform and the
          product&apos;s AI surface end to end. Before that I spent five years
          at lead level building real-time financial interfaces: crypto
          portfolio analytics and live equities trading, leading frontend
          teams of seven and five. The tools I reach for most are Python and
          TypeScript, LangGraph and LangSmith, MCP servers for giving agents
          access to external systems, retrieval over vector search, and
          evaluation pipelines that run in CI.
        </p>

        <h2 id="contact">Contact and profiles</h2>
        <ul>
          {PROFILES.map((profile) => (
            <li key={profile.href}>
              <strong>{profile.label}:</strong>{" "}
              <ExternalLink href={profile.href}>{profile.text}</ExternalLink>
            </li>
          ))}
        </ul>
        <p>
          For security reports about Agentling, see the{" "}
          <a href="/contributing#reporting-vulnerabilities">contributing page</a>.
        </p>

        <h2 id="bio">Short biography</h2>
        <p>
          Folarin Akinloye is an AI engineer who builds agentic systems and
          AI-powered products. He is the creator of Agentling, an open-source
          Python framework for building AI agents. His work focuses on agent
          architectures, AI product engineering, and the infrastructure needed
          to build reliable AI systems.
        </p>
      </div>
    </div>
  );
}
