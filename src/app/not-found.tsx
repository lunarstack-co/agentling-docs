import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
        This page took a different tool call
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        The page you are looking for does not exist or has moved. Try the
        docs, or head back home.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/docs"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity duration-150 hover:opacity-90"
        >
          Browse the docs
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-150 hover:border-border-strong"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
