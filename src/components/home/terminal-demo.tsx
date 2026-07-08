"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface TerminalLine {
  prefix: string;
  prefixClass: string;
  text: string;
  textClass?: string;
  /** Milliseconds to pause before this line starts. */
  pause: number;
  /** Type character by character instead of appearing at once. */
  typed?: boolean;
}

const SCRIPT: TerminalLine[] = [
  {
    prefix: "$",
    prefixClass: "text-faint",
    text: "python weather_agent.py",
    pause: 400,
    typed: true,
  },
  {
    prefix: "task",
    prefixClass: "text-sky-400",
    text: "What's the weather in Paris?",
    pause: 500,
  },
  {
    prefix: "tool",
    prefixClass: "text-amber-400",
    text: 'get_weather(city="Paris")',
    pause: 700,
  },
  {
    prefix: "obs",
    prefixClass: "text-purple-400",
    text: "It is 22C and sunny in Paris.",
    pause: 650,
  },
  {
    prefix: "final",
    prefixClass: "text-accent",
    text: "It is 22C and sunny in Paris. A good day to be outside.",
    pause: 600,
    typed: true,
  },
  {
    prefix: "✓",
    prefixClass: "text-accent",
    text: "run completed · 2 steps · 214 tokens",
    textClass: "text-faint",
    pause: 500,
  },
];

const TYPE_INTERVAL_MS = 24;
const RESTART_PAUSE_MS = 4200;

export function TerminalDemo() {
  const reduceMotion = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const done = lineIndex >= SCRIPT.length;

  useEffect(() => {
    if (reduceMotion) return;

    if (done) {
      timer.current = setTimeout(() => {
        setLineIndex(0);
        setCharIndex(0);
      }, RESTART_PAUSE_MS);
      return () => clearTimeout(timer.current);
    }

    const line = SCRIPT[lineIndex];
    if (charIndex === 0) {
      timer.current = setTimeout(() => setCharIndex(1), line.pause);
    } else if (line.typed && charIndex <= line.text.length) {
      timer.current = setTimeout(
        () => setCharIndex((index) => index + 1),
        TYPE_INTERVAL_MS,
      );
    } else {
      timer.current = setTimeout(() => {
        setLineIndex((index) => index + 1);
        setCharIndex(0);
      }, 0);
    }
    return () => clearTimeout(timer.current);
  }, [reduceMotion, done, lineIndex, charIndex]);

  const visibleLines = useMemo(() => {
    if (reduceMotion) {
      return SCRIPT.map((line) => ({ line, text: line.text, cursor: false }));
    }
    return SCRIPT.slice(0, lineIndex + 1).map((line, index) => {
      if (index < lineIndex) {
        return { line, text: line.text, cursor: false };
      }
      const started = charIndex > 0;
      const text = line.typed
        ? line.text.slice(0, Math.max(0, charIndex - 1))
        : started
          ? line.text
          : "";
      return { line, text, cursor: started && index === lineIndex };
    });
  }, [reduceMotion, lineIndex, charIndex]);

  return (
    <div
      role="img"
      aria-label="Terminal recording of an agentling run: the agent receives a task, calls a weather tool, observes the result, and streams a final answer."
      className="overflow-hidden rounded-2xl border border-border-strong bg-terminal shadow-soft"
    >
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
        <span className="ml-3 font-mono text-xs text-[#5f6b82]">
          agentling · demo
        </span>
      </div>
      <div className="min-h-56 px-5 py-5 font-mono text-[13px] leading-7">
        {visibleLines.map(({ line, text, cursor }, index) => (
          <p key={index} className="flex gap-3 whitespace-pre-wrap">
            <span className={cn("w-10 shrink-0 select-none", line.prefixClass)}>
              {line.prefix}
            </span>
            <span className={cn("text-[#d5dbe8]", line.textClass)}>
              {text}
              {cursor && (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-4 w-[7px] translate-y-0.5 animate-blink bg-[#34d399]"
                />
              )}
            </span>
          </p>
        ))}
        {!done && !reduceMotion && visibleLines.length === 0 && (
          <span
            aria-hidden
            className="inline-block h-4 w-[7px] animate-blink bg-[#34d399]"
          />
        )}
      </div>
    </div>
  );
}
