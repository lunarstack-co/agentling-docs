import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so the bundler never walks up into parent
  // directories looking for lockfiles.
  turbopack: {
    root: __dirname,
  },
  // The markdown in /content and the Open Graph fonts are read from the
  // filesystem at render time, so both must be traced into serverless
  // output on deploy.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*", "./src/assets/fonts/**"],
  },
  // URLs that used to be linked from the site and still receive requests.
  async redirects() {
    return [
      { source: "/feed.xml", destination: "/changelog.xml", permanent: true },
      { source: "/blog", destination: "/changelog", permanent: true },
      { source: "/blog/:path*", destination: "/changelog", permanent: true },
      { source: "/roadmap", destination: "/changelog", permanent: true },
      // Pages moved or merged in the 0.2.0 rewrite.
      ...[
        ["core-concepts/agent-loop", "concepts/the-agent-loop"],
        ["core-concepts/memory", "reference/memory"],
        ["core-concepts/skills", "tutorial/skills"],
        ["core-concepts/streaming-events", "tutorial/stream-events"],
        ["core-concepts/tools", "reference/tools"],
        ["guides/dynamic-tools-and-mcp", "how-to/tools-from-a-schema-or-mcp"],
        ["guides/error-handling", "tutorial/handle-failures"],
        ["guides/interruption", "how-to/interrupt-from-a-ui"],
        ["guides/other-providers", "how-to/write-a-model-adapter"],
        ["guides/persistence-and-resuming", "how-to/persist-sessions"],
        ["guides/sessions-and-concurrency", "reference/agent-and-session"],
        ["reference/agent-api", "reference/agent-and-session"],
        ["reference/openai-model", "how-to/write-a-model-adapter"],
        ["core-concepts", "concepts/the-agent-loop"],
        ["guides", "how-to/write-a-model-adapter"],
      ].map(([from, to]) => ({
        source: `/docs/${from}`,
        destination: `/docs/${to}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
