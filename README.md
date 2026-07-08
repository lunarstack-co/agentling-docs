# agentling docs

The documentation website for [agentling](https://github.com/folathecoder/agentling), a tiny async framework for reliable, observable, tool-using agents in Python.

The site includes an animated homepage, full documentation with sidebar navigation, search, and a table of contents, a blog for releases and technical writing, a changelog, contributing instructions, and legal pages. Light and dark themes are supported, with dark as the default.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript, Turbopack)
- [Tailwind CSS v4](https://tailwindcss.com/) with semantic design tokens
- [Hygraph](https://hygraph.com/) as the headless CMS
- [Motion](https://motion.dev/) for animation, [shiki](https://shiki.style/) via rehype-pretty-code for syntax highlighting

## Architecture

The interesting part of this repository is the content layer:

```
content/            markdown seed content (docs, blog, changelog, pages)
src/lib/content/    the data layer
  hygraph.ts        minimal Content API client, credentials read lazily
  seed.ts           filesystem loader for /content
  index.ts          getters that ask Hygraph first, then fall back to seed
scripts/
  hygraph-seed.mjs  idempotent upsert of /content into Hygraph
```

Every page asks Hygraph for content and transparently falls back to the bundled markdown in `/content` when the CMS is not configured, unreachable, or empty. That means:

- The site builds and runs with zero environment variables.
- `/content` is the single source of truth for seeding the CMS, and the safety net at runtime.
- Fixing a typo in the docs can be a pull request against this repository.

Pages are statically generated and revalidate every five minutes (ISR), so published changes in Hygraph appear without a redeploy.

## Getting started

Requires Node.js 20.9 or newer.

```bash
git clone https://github.com/folathecoder/agentling-docs
cd agentling-docs
npm install
npm run dev
```

The site runs at `http://localhost:3000` using the bundled seed content. No credentials needed.

## Connecting Hygraph

1. Create a Hygraph project and add the models described in [`hygraph/SCHEMA.md`](hygraph/SCHEMA.md).
2. Copy `.env.example` to `.env.local` and fill in `HYGRAPH_CONTENT_API` and `HYGRAPH_TOKEN`.
3. Push the seed content into your project:

```bash
npm run seed
```

The seed script is idempotent: it upserts by slug (or version) and publishes, so running it again is always safe.

For a deployed site, prefer a token that can only read published content. The seed script is the only thing that needs write permissions, and it runs from your machine.

## Checks

```bash
npm run lint    # eslint
npx tsc --noEmit
npm run build   # production build
```

## Contributing

Contributions are welcome. See the [contributing guide](https://agentling.dev/contributing) for the project conventions, and open a pull request against this repository for anything site related.

## License

MIT, consistent with the agentling framework itself.
