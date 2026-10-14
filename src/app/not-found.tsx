import Link from "next/link";

import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col items-start px-4 pb-20 pt-16 sm:px-6 lg:pt-24">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-balance text-h1 font-semibold tracking-[-0.02em] text-fg">
        There is no page at this address.
      </h1>
      <p className="mt-3 max-w-md text-lede text-fg-secondary">
        It may have moved, or the link may be out of date. The documentation
        index lists every page, and search is one keystroke away.
      </p>
      <Link
        href="/docs/getting-started/introduction"
        className={buttonClass({ variant: "outline", className: "mt-8" })}
      >
        Open the documentation
      </Link>
    </div>
  );
}
