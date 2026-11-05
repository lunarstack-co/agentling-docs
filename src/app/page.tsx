import Link from "next/link";

import { HeroLoop } from "@/components/hero-loop";
import { InstallCommand } from "@/components/install-command";
import { DEFAULT_TITLE, pageMetadata } from "@/lib/seo";
import { GITHUB_URL, VERSION } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  kind: "page",
  title: DEFAULT_TITLE,
  absoluteTitle: true,
  path: "/",
});

/** Every word on the page, so a copy change is one diff. */
const COPY = {
  eyebrow: { label: `Agentling ${VERSION}`, text: "Any model, one loop", href: "/changelog" },
  headline: { first: "Bring your model.", lead: "Run", rest: "the loop." },
  install: { command: "pip install agentling", alternative: "or uv add agentling" },
  action: { label: "Start the tutorial", href: "/docs/getting-started/introduction" },
  doors: [
    {
      label: "01 / Docs",
      title: "Learn it.",
      line: "From install to your own harness, with examples that run.",
      link: "Read the docs",
      href: "/docs/getting-started/introduction",
      external: false,
    },
    {
      label: "02 / Source",
      title: "Read the loop.",
      line: "One file. MIT licensed. Read it in a sitting.",
      link: "Open the repository",
      href: GITHUB_URL,
      external: true,
    },
    {
      label: "03 / Built with it",
      title: "Aldwin.",
      line: "A local assistant whose engine is Agentling.",
      link: "See Aldwin",
      href: "https://github.com/lunarstack-co/aldwin",
      external: true,
    },
  ],
} as const;

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-[72px] sm:px-6">
      <div className="border-x border-frame">
        <section
          aria-label="Agentling"
          className="relative flex items-center overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-12 lg:pb-[72px] lg:pt-[116px] xl:px-16"
        >
          <div aria-hidden className="bg-graph pointer-events-none absolute inset-0" />

          <div className="relative flex w-full flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 xl:gap-12">
            <div className="min-w-0 lg:w-[48%] xl:w-[48%]">
              <Link
                href={COPY.eyebrow.href}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-border-default bg-base py-1.5 pl-1.5 pr-3 text-sm text-accent outline-none focus:outline-none hover:outline-none active:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:mb-9"
              >
                <span className="rounded-full bg-accent-subtle px-2 py-0.5 font-semibold">
                  {COPY.eyebrow.label}
                </span>
                {COPY.eyebrow.text}
                <span aria-hidden>→</span>
              </Link>

              <h1 className="flex flex-col gap-1.5 text-[clamp(2.5rem,7.5vw,3.75rem)] tracking-[-0.025em] text-fg [font-variation-settings:'wght'_440,'opsz'_48] sm:gap-2 lg:gap-2.5 lg:text-[clamp(3.3rem,5.3vw,4.8rem)]">
                <span className="block leading-[1.04] lg:whitespace-nowrap">
                  {COPY.headline.first}
                </span>
                <span className="block leading-[1.04] lg:whitespace-nowrap">
                  <span className="text-fg-tertiary">{COPY.headline.lead}</span>{" "}
                  {COPY.headline.rest}
                </span>
              </h1>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3 lg:mt-10">
                <div className="w-full sm:w-[300px]">
                  <InstallCommand
                    command={COPY.install.command}
                    alternative={COPY.install.alternative}
                  />
                </div>
                <Link
                  href={COPY.action.href}
                  className="inline-flex h-[50px] w-full shrink-0 items-center justify-center rounded-control border border-transparent bg-fg px-5 text-md font-semibold text-[var(--bg-base)] transition-colors duration-150 hover:opacity-90 sm:w-auto"
                >
                  {COPY.action.label}
                </Link>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-[520px] items-center justify-center lg:mx-0 lg:w-[50%] lg:max-w-none lg:px-2 xl:w-[50%] xl:px-4">
              <HeroLoop className="max-h-[260px] sm:max-h-none lg:h-[420px]" />
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 border border-frame lg:grid-cols-3">
        {COPY.doors.map((door, index) => (
          <Door key={door.label} {...door} index={index} />
        ))}
      </div>
    </div>
  );
}

function Door({
  label,
  title,
  line,
  link,
  href,
  external,
  index,
}: (typeof COPY.doors)[number] & { index: number }) {
  const className = cn(
    "group relative flex flex-col p-5 text-fg no-underline transition-colors duration-200 hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-[6px] focus-visible:outline-accent lg:p-8",
    index > 0 && "border-t border-frame lg:border-l lg:border-t-0",
  );
  const content = (
    <>
      <span aria-hidden className="absolute left-0 top-0 h-[3px] w-16 bg-border-default" />
      <span aria-hidden className="absolute left-0 top-0 h-16 w-[3px] bg-border-default" />
      <span className="brand-label block">{label}</span>
      <h2
        id={`door-${index}`}
        className="mb-3 mt-6 text-[28px] leading-[1.1] tracking-[-0.02em] [font-variation-settings:'wght'_440,'opsz'_48] sm:text-[32px] lg:text-[40px]"
      >
        {title}
      </h2>
      <p className="mb-12 max-w-[330px] text-lg leading-[1.5] text-fg-secondary">
        {line}
      </p>
      <span className="mt-auto flex items-center justify-between text-md font-semibold text-accent">
        <span className="group-hover:underline group-hover:underline-offset-4">{link}</span>
        <span className="text-xl leading-none transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden>
          →
        </span>
      </span>
    </>
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-labelledby={`door-${index} door-${index}-new-tab`}
        className={className}
      >
        {content}
        <span id={`door-${index}-new-tab`} className="sr-only">
          (opens in a new tab)
        </span>
      </a>
    );
  }
  return (
    <Link href={href} aria-labelledby={`door-${index}`} className={className}>
      {content}
    </Link>
  );
}
