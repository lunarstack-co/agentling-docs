import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "ghost" | "outline" | "primary";

const BASE =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-control text-ui font-medium transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97] active:duration-100 disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  ghost: "px-2.5 text-fg-secondary hover:bg-sunken hover:text-fg",
  outline:
    "border border-border-default bg-raised px-2.5 text-fg-secondary hover:bg-sunken hover:text-fg",
  primary: "bg-accent px-3 text-accent-fg hover:bg-accent-hover",
};

/**
 * Class recipe for anything that looks like a button, so links and real
 * buttons share one set of states.
 */
export function buttonClass({
  variant = "ghost",
  icon = false,
  className,
}: {
  variant?: ButtonVariant;
  icon?: boolean;
  className?: string;
} = {}): string {
  return cn(BASE, VARIANTS[variant], icon && "w-8 px-0", className);
}

export function Button({
  variant = "ghost",
  icon = false,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: boolean;
}) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, icon, className })}
      {...props}
    />
  );
}
