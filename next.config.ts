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
    ];
  },
};

export default nextConfig;
