import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

import { GithubIcon } from "@/components/icons/github";
import { InstallCommand } from "@/components/install-command";
import { DEFAULT_TITLE, pageMetadata } from "@/lib/seo";
import { GITHUB_URL, PYPI_URL, VERSION } from "@/lib/site";
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
  kicker: "Agent engine for Python",
  install: { command: "pip install agentling", alternative: "or uv add agentling" },
  actions: {
    primary: { label: "Start the tutorial", href: "/docs/getting-started/introduction" },
    secondary: { label: "View on GitHub", href: GITHUB_URL },
  },
  rail: [
    { label: "Source on GitHub", href: GITHUB_URL, icon: GithubIcon },
    { label: "Package on PyPI", href: PYPI_URL, icon: PypiIcon },
  ],
  doors: [
    {
      label: "01 / Docs",
      title: "Read the docs.",
      line: "From install to your own harness, with examples that run.",
      link: "Start the tutorial",
      href: "/docs/getting-started/introduction",
      external: false,
      tone: "teal",
    },
    {
      label: "02 / Source",
      title: "Read the loop.",
      line: "One file. MIT licensed. Read it in a sitting.",
      link: "Open the repository",
      href: GITHUB_URL,
      external: true,
      tone: "indigo",
    },
    {
      label: "03 / Built with it",
      title: "Aldwin.",
      line: "A local assistant whose engine is Agentling.",
      link: "See Aldwin",
      href: "https://github.com/lunarstack-co/aldwin",
      external: true,
      tone: "orange",
    },
  ],
} as const;

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-[72px] sm:px-6">
      <div className="border-x border-frame">
        <section
          aria-label="Agentling"
          className="relative flex min-h-[calc(100svh-56px)] items-end overflow-hidden px-4 pb-10 sm:px-6 lg:px-8 lg:pb-[60px]"
        >
          <div aria-hidden className="bg-graph pointer-events-none absolute inset-0" />

          <div className="relative flex w-full items-end gap-0 lg:gap-12">
            <ul className="hidden shrink-0 flex-col gap-[22px] lg:flex" aria-label="Links">
              {COPY.rail.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${item.label} (opens in a new tab)`}
                    className="flex size-10 items-center justify-center rounded-control text-fg-secondary transition-colors duration-150 hover:bg-neutral-muted hover:text-fg"
                  >
                    <item.icon className="size-6" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="min-w-0 flex-1">
              <Link
                href={COPY.eyebrow.href}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-frame bg-base py-1.5 pl-1.5 pr-3 text-sm text-accent transition-colors duration-150 hover:border-border-default lg:mb-10"
              >
                <span className="rounded-full bg-accent-subtle px-2 py-0.5 font-semibold">
                  {COPY.eyebrow.label}
                </span>
                {COPY.eyebrow.text}
                <span aria-hidden>→</span>
              </Link>

              <h1 className="flex flex-col text-[44px] tracking-[-0.025em] text-fg [font-variation-settings:'wght'_440,'opsz'_48] sm:text-[62px] md:gap-2 md:text-[96px] lg:gap-4 lg:text-[112px]">
                <span className="block leading-[1]">{COPY.headline.first}</span>{" "}
                <span className="block leading-[1.1]">
                  <span className="text-fg-tertiary">{COPY.headline.lead}</span>{" "}
                  {COPY.headline.rest}
                </span>
              </h1>

              <div className="mt-10 flex flex-col gap-4 lg:mt-12 lg:flex-row lg:items-start">
                <div className="w-full max-w-[400px]">
                  <InstallCommand
                    command={COPY.install.command}
                    alternative={COPY.install.alternative}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <BrandButton href={COPY.actions.primary.href} variant="primary">
                    {COPY.actions.primary.label}
                  </BrandButton>
                  <BrandButton href={COPY.actions.secondary.href} external>
                    <GithubIcon className="size-4" />
                    {COPY.actions.secondary.label}
                  </BrandButton>
                </div>
              </div>
            </div>

            <div className="hidden shrink-0 flex-col items-end lg:flex">
              <CornerBracket className="h-[115px] w-[116px] text-fg-secondary" />
              <p className="brand-label mt-5">{COPY.kicker}</p>
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

function BrandButton({
  href,
  variant = "secondary",
  external = false,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  external?: boolean;
  children: ReactNode;
}) {
  const className = cn(
    "inline-flex h-12 items-center gap-2 rounded-control border px-5 text-md font-semibold transition-colors duration-150",
    variant === "primary"
      ? "border-transparent bg-fg text-[var(--bg-base)] hover:opacity-90"
      : "border-border-default bg-neutral-muted text-fg hover:bg-control-hover",
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
        <NewTab />
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** One Primer display colour per door, for its corner and its hover tint. */
const TONES = {
  teal: "[--tone:var(--display-teal)] [--tone-muted:var(--display-teal-muted)]",
  indigo: "[--tone:var(--display-indigo)] [--tone-muted:var(--display-indigo-muted)]",
  orange: "[--tone:var(--display-orange)] [--tone-muted:var(--display-orange-muted)]",
} as const;

function Door({
  label,
  title,
  line,
  link,
  href,
  external,
  tone,
  index,
}: (typeof COPY.doors)[number] & { index: number }) {
  const className = cn(
    TONES[tone],
    "group relative flex min-h-[340px] flex-col p-5 text-fg no-underline transition-colors duration-200 hover:bg-[var(--tone-muted)] focus-visible:bg-[var(--tone-muted)] focus-visible:outline-2 focus-visible:-outline-offset-[6px] focus-visible:outline-accent lg:min-h-[430px] lg:p-8",
    index > 0 && "border-t border-frame lg:border-l lg:border-t-0",
  );
  const content = (
    <>
      <span aria-hidden className="absolute left-0 top-0 h-[3px] w-16 bg-[var(--tone)]" />
      <span aria-hidden className="absolute left-0 top-0 h-16 w-[3px] bg-[var(--tone)]" />
      <span className="brand-label block">{label}</span>
      <h2
        id={`door-${index}`}
        className="mb-4 mt-auto text-[clamp(2.5rem,3.9vw,4.25rem)] leading-[1] tracking-[-0.025em] [font-variation-settings:'wght'_440,'opsz'_48]"
      >
        {title}
      </h2>
      <p className="mb-8 min-h-[3.2em] max-w-[330px] text-lg leading-[1.5] text-fg-secondary lg:mb-10">
        {line}
      </p>
      <span className="flex items-center justify-between text-md font-semibold text-accent">
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

function NewTab() {
  return <span className="sr-only"> (opens in a new tab)</span>;
}

function CornerBracket(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-1 -1 116 115" fill="none" aria-hidden {...props}>
      <path
        d="M114 0V113M114 113H0M114 113L1 0"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function PypiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9L12 3zm0 0v18M4.2 7.5L12 12l7.8-4.5"
      />
    </svg>
  );
}
