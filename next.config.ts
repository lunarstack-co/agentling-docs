import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so the bundler never walks up into parent
  // directories looking for lockfiles.
  turbopack: {
    root: __dirname,
  },
  // The bundled seed content in /content is read from the filesystem at
  // runtime as the zero-credential fallback, so it must be traced into
  // serverless output on deploy.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
};

export default nextConfig;
