# Agentling Docs

[![CI](https://github.com/lunarstack-co/agentling-docs/actions/workflows/ci.yml/badge.svg)](https://github.com/lunarstack-co/agentling-docs/actions/workflows/ci.yml)

Source for **[agentling.dev](https://agentling.dev)**, the documentation site for [Agentling](https://github.com/lunarstack-co/agentling).

Built with Next.js 16 (App Router), Tailwind CSS v4, and local Markdown. No external CMS or database required.

## Quickstart

Requires Node.js 20.9 or newer.

```bash
git clone https://github.com/lunarstack-co/agentling-docs
cd agentling-docs
npm install
npm run dev
```

Runs locally at `http://localhost:3000`.

## Content structure

All content lives in `/content` as plain Markdown with frontmatter:

```
content/
  docs/<section>/_section.md   # Section title and order
  docs/<section>/<page>.md     # Documentation page
  changelog/<version>.md       # Release entry
  pages/<slug>.md              # Contributing, privacy, terms
```

Every page is statically generated at build time. To update documentation, edit the markdown file and open a PR.

## Validation and checks

Run all checks locally before submitting a PR:

```bash
npm run validate   # checks frontmatter, slugs, and internal links
npm run lint       # eslint
npx tsc --noEmit   # type check
npm run build      # static export build
```

## Intentionally unlinked pages

- `/creator` (`src/app/creator/page.tsx`) is the creator profile. It is indexable (200, self-referencing canonical, listed in `sitemap.xml`) but deliberately absent from the header, sidebar, footer, and search index, and nothing links to it internally. That is a product decision, not an oversight. Keep it that way unless the decision changes.

## Machine-readable endpoints

- `/changelog.xml`: RSS feed for releases.
- `/llms.txt` & `/llms-full.txt`: plain-text documentation indexes for LLM context.
- `/search-index.json`: local fuzzy search index.

## License

[MIT](https://github.com/lunarstack-co/agentling/blob/main/LICENSE)
