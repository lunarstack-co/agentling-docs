"use client";

import { useEffect, useRef, type SVGProps } from "react";

import { MARK_PATH } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

/**
 * Smooth 0..1 opacity envelope for a caption window (fade-in, hold, fade-out).
 */
function captionOpacity(
  tMs: number,
  startMs: number,
  fadeInMs: number,
  holdMs: number,
  fadeOutMs: number,
): number {
  if (tMs < startMs) return 0;
  const elapsed = tMs - startMs;
  if (elapsed < fadeInMs) {
    return elapsed / fadeInMs;
  }
  if (elapsed < fadeInMs + holdMs) {
    return 1;
  }
  if (elapsed < fadeInMs + holdMs + fadeOutMs) {
    return 1 - (elapsed - fadeInMs - holdMs) / fadeOutMs;
  }
  return 0;
}

function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * Math.max(0, Math.min(1, x))) - 1) / 2;
}

/**
 * Piecewise smooth progress (0..1 around the loop) for one 2400ms lap:
 * - 0..600ms:     top (0.00) -> left "Your model" (0.25)
 * - 600..1800ms:  left (0.25) -> bottom (0.50) -> right "Your tools" (0.75)
 * - 1800..2400ms: right (0.75) -> top (1.00)
 */
function lapProgress(lapMs: number): number {
  if (lapMs <= 600) {
    return 0.25 * easeInOutSine(lapMs / 600);
  }
  if (lapMs <= 1800) {
    return 0.25 + 0.5 * easeInOutSine((lapMs - 600) / 1200);
  }
  return 0.75 + 0.25 * easeInOutSine((lapMs - 1800) / 600);
}

export function HeroLoop({ className, ...props }: SVGProps<SVGSVGElement>) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const loopPathRef = useRef<SVGPathElement | null>(null);
  const dotRef = useRef<SVGCircleElement | null>(null);
  const thinksRef = useRef<SVGTextElement | null>(null);
  const actsRef = useRef<SVGTextElement | null>(null);
  const answersRef = useRef<SVGTextElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const loopPath = loopPathRef.current;
    const dot = dotRef.current;
    const thinks = thinksRef.current;
    const acts = actsRef.current;
    const answers = answersRef.current;
    if (!svg || !loopPath || !dot || !thinks || !acts || !answers) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let rafId: number | null = null;
    let isVisible = true;
    let isTabVisible = !document.hidden;
    let lastTimestamp: number | null = null;
    let cycleElapsedMs = 0;

    const CYCLE_MS = 7000;
    const totalLength = loopPath.getTotalLength();

    const applyReducedMotionState = () => {
      dot.setAttribute("cx", "300");
      dot.setAttribute("cy", "182");
      thinks.style.opacity = "1";
      acts.style.opacity = "1";
      answers.style.opacity = "1";
    };

    const step = (timestamp: number) => {
      if (motionQuery.matches) {
        applyReducedMotionState();
        rafId = null;
        return;
      }

      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }
      const delta = Math.min(timestamp - lastTimestamp, 100);
      lastTimestamp = timestamp;
      cycleElapsedMs = (cycleElapsedMs + delta) % CYCLE_MS;

      const t = cycleElapsedMs;

      if (t < 2400) {
        const prog = lapProgress(t);
        const pt = loopPath.getPointAtLength(prog * totalLength);
        dot.setAttribute("cx", pt.x.toFixed(2));
        dot.setAttribute("cy", pt.y.toFixed(2));
      } else if (t < 4800) {
        const prog = lapProgress(t - 2400);
        const pt = loopPath.getPointAtLength(prog * totalLength);
        dot.setAttribute("cx", pt.x.toFixed(2));
        dot.setAttribute("cy", pt.y.toFixed(2));
      } else if (t < 5200) {
        const p = easeInOutSine((t - 4800) / 400);
        const y = 182 - 54 * p;
        dot.setAttribute("cx", "300");
        dot.setAttribute("cy", y.toFixed(2));
      } else if (t < 6150) {
        dot.setAttribute("cx", "300");
        dot.setAttribute("cy", "128");
      } else if (t < 6400) {
        const p = easeInOutSine((t - 6150) / 250);
        const y = 128 + 54 * p;
        dot.setAttribute("cx", "300");
        dot.setAttribute("cy", y.toFixed(2));
      } else {
        dot.setAttribute("cx", "300");
        dot.setAttribute("cy", "182");
      }

      // Stage captions synced to the dot passing each station:
      // "Your model" apex at 600ms/3000ms, "Your tools" apex at 1800ms/4200ms, "Your harness" at 5200ms.
      const thinksOp = Math.max(
        captionOpacity(t, 380, 250, 800, 250),
        captionOpacity(t, 2780, 250, 800, 250),
      );
      const actsOp = Math.max(
        captionOpacity(t, 1580, 250, 800, 250),
        captionOpacity(t, 3980, 250, 800, 250),
      );
      const answersOp = captionOpacity(t, 5000, 250, 1000, 250);

      thinks.style.opacity = thinksOp.toFixed(3);
      acts.style.opacity = actsOp.toFixed(3);
      answers.style.opacity = answersOp.toFixed(3);

      if (isVisible && isTabVisible && !motionQuery.matches) {
        rafId = window.requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    };

    const updatePlayState = () => {
      if (motionQuery.matches) {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        applyReducedMotionState();
        return;
      }

      if (isVisible && isTabVisible) {
        if (rafId === null) {
          lastTimestamp = null;
          rafId = window.requestAnimationFrame(step);
        }
      } else if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          isVisible = entry.isIntersecting;
          updatePlayState();
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(svg);

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      updatePlayState();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener("change", updatePlayState);

    updatePlayState();

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", updatePlayState);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 600 420"
      fill="none"
      role="img"
      aria-label="Your harness, your model and your tools connect to the Agentling agent engine. The model thinks, the tools act, and the loop repeats until the model answers."
      className={cn("hero-loop w-full select-none", className)}
      {...props}
    >
      <line
        x1="300"
        y1="128"
        x2="300"
        y2="182"
        stroke="var(--fg-secondary)"
        strokeOpacity="0.48"
        strokeWidth="1.5"
      />
      <line
        x1="116"
        y1="256"
        x2="130"
        y2="256"
        stroke="var(--fg-secondary)"
        strokeOpacity="0.48"
        strokeWidth="1.5"
      />
      <line
        x1="470"
        y1="256"
        x2="484"
        y2="256"
        stroke="var(--fg-secondary)"
        strokeOpacity="0.48"
        strokeWidth="1.5"
      />

      <path
        ref={loopPathRef}
        d="M 300 182 H 204 A 74 74 0 0 0 204 330 H 396 A 74 74 0 0 0 396 182 Z"
        fill="var(--accent-subtle)"
        fillOpacity="0.22"
        stroke="var(--accent)"
        strokeWidth="2"
      />

      <svg
        x="277"
        y="233"
        width="46"
        height="46"
        viewBox="0 0 256 256"
        aria-hidden="true"
      >
        <path d={MARK_PATH} fill="var(--fg)" />
      </svg>

      <text
        x="300"
        y="351"
        textAnchor="middle"
        dominantBaseline="hanging"
        fill="var(--fg-secondary)"
        className="hero-loop-engine-label"
      >
        AGENT ENGINE
      </text>

      <g>
        <rect
          x="210"
          y="84"
          width="180"
          height="44"
          rx="6"
          fill="var(--bg-raised)"
          stroke="var(--border-default)"
          strokeWidth="1.5"
        />
        <text
          x="300"
          y="106"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--fg)"
          className="hero-loop-label"
        >
          Your harness
        </text>
      </g>

      <g>
        <rect
          x="4"
          y="235"
          width="112"
          height="42"
          rx="6"
          fill="var(--bg-raised)"
          stroke="var(--border-default)"
          strokeWidth="1.5"
        />
        <text
          x="60"
          y="256"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--fg)"
          className="hero-loop-label"
        >
          Your model
        </text>
      </g>

      <g>
        <rect
          x="484"
          y="235"
          width="112"
          height="42"
          rx="6"
          fill="var(--bg-raised)"
          stroke="var(--border-default)"
          strokeWidth="1.5"
        />
        <text
          x="540"
          y="256"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--fg)"
          className="hero-loop-label"
        >
          Your tools
        </text>
      </g>

      <text
        ref={thinksRef}
        x="60"
        y="289"
        textAnchor="middle"
        dominantBaseline="hanging"
        fill="var(--fg-secondary)"
        aria-hidden="true"
        className="hero-loop-caption"
      >
        thinks
      </text>
      <text
        ref={actsRef}
        x="540"
        y="289"
        textAnchor="middle"
        dominantBaseline="hanging"
        fill="var(--fg-secondary)"
        aria-hidden="true"
        className="hero-loop-caption"
      >
        acts
      </text>
      <text
        ref={answersRef}
        x="300"
        y="72"
        textAnchor="middle"
        dominantBaseline="auto"
        fill="var(--fg-secondary)"
        aria-hidden="true"
        className="hero-loop-caption"
      >
        answers
      </text>

      <circle
        ref={dotRef}
        cx="300"
        cy="182"
        r="4.5"
        fill="var(--accent)"
        aria-hidden="true"
      />
    </svg>
  );
}
