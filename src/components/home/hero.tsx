"use client";

import { ArrowRight, Check, Copy } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

import { TerminalDemo } from "@/components/home/terminal-demo";

const INSTALL_COMMAND = "pip install agentling";

function Entrance({
  children,
  delay,
  className,
}: {
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.65, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}

function InstallButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable; the command is still readable.
    }
  }

  return (
    <button
      onClick={copy}
      aria-label={copied ? "Copied" : `Copy ${INSTALL_COMMAND}`}
      className="flex h-11 cursor-pointer items-center gap-3 rounded-full border border-border bg-card px-5 font-mono text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground"
    >
      <span aria-hidden className="text-accent">
        $
      </span>
      {INSTALL_COMMAND}
      {copied ? (
        <Check className="size-3.5 text-accent" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-130 w-3xl -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
        <div>
          <Entrance delay={0}>
            <Link
              href="/changelog"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1.5 pr-3.5 text-xs text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground"
            >
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono font-semibold text-accent">
                v0.1.0
              </span>
              agentling is now on PyPI
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </Entrance>

          <Entrance delay={0.08}>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
              The agent framework you can{" "}
              <span className="text-gradient">read in one sitting</span>
            </h1>
          </Entrance>

          <Entrance delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              agentling is a tiny async framework for reliable, observable,
              tool-using agents: a clean ReAct loop, typed memory, streaming
              events, recoverable failures, and progressive-disclosure skills,
              in around 800 lines of Python.
            </p>
          </Entrance>

          <Entrance delay={0.24} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/getting-started/quickstart"
              className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-opacity duration-150 hover:opacity-90"
            >
              Get started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <InstallButton />
          </Entrance>
        </div>

        <Entrance delay={0.2}>
          <TerminalDemo />
        </Entrance>
      </div>
    </section>
  );
}
