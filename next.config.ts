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
};

export default nextConfig;
