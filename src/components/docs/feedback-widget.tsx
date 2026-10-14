"use client";

import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

export function FeedbackWidget() {
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleVote(choice: "yes" | "no") {
    setVoted(choice);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded border border-border bg-card p-3 font-sans text-xs text-muted-foreground">
        <Check className="size-3.5 text-accent" />
        <span>Thank you for your feedback.</span>
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-card p-4 text-xs font-sans">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">
          Was this page helpful?
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleVote("yes")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              voted === "yes"
                ? "border-accent bg-accent/10 text-accent font-medium"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ThumbsUp className="size-3" />
            <span>Yes</span>
          </button>
          <button
            onClick={() => handleVote("no")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              voted === "no"
                ? "border-red-500 bg-red-500/10 text-red-500 font-medium"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ThumbsDown className="size-3" />
            <span>No</span>
          </button>
        </div>
      </div>

      {voted && (
        <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-border">
          <label htmlFor="feedback-input" className="block text-muted-foreground mb-1.5 text-[11px]">
            {voted === "yes"
              ? "What was most helpful? (optional)"
              : "What could be improved? (optional)"}
          </label>
          <div className="flex gap-2">
            <input
              id="feedback-input"
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Your thoughts..."
              className="flex-1 rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-foreground px-3 py-1 font-medium text-background hover:opacity-90 transition-opacity cursor-pointer text-xs"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
