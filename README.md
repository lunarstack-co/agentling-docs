# agentling docs

The documentation website for [agentling](https://github.com/folathecoder/agentling), a tiny async framework for reliable, observable, tool-using agents in Python.

The site includes an animated homepage, full documentation with sidebar navigation, search, and a table of contents, a blog for releases and technical writing, a changelog, contributing instructions, and legal pages. Light and dark themes are supported, with dark as the default.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript, Turbopack)
- [Tailwind CSS v4](https://tailwindcss.com/) with semantic design tokens
- [Motion](https://motion.dev/) for animation, [shiki](https://shiki.style/) via rehype-pretty-code for syntax highlighting
- Content as markdown in the repository, no CMS and no external services

## How content works

Everything the site renders lives in `/content` as markdown with frontmatter:

```
content/
  docs/<section>/_section.md   section title, icon, and sidebar order
  docs/<section>/<page>.md     one documentation page
  blog/<slug>.md               one blog post
  changelog/<version>.md       one release
  pages/<slug>.md              contributing, privacy, terms
```

`src/lib/content/index.ts` reads these files at build time and every page is statically generated. Publishing a doc page, blog post, or changelog entry is:

1. Add or edit a markdown file in `/content`.
2. Commit and push (or open a pull request).
3. The next deploy ships it.

There are no environment variables, tokens, or external services required, which also means contributions to the docs are ordinary pull requests.

## Getting started

Requires Node.js 20.9 or newer.

```bash
git clone https://github.com/folathecoder/agentling-docs
cd agentling-docs
npm install
npm run dev
```

The site runs at `http://localhost:3000`.

## Writing content

Frontmatter fields by content type:

| Type | Required | Optional |
| --- | --- | --- |
| Doc section (`_section.md`) | `title`, `slug`, `order` | `description`, `icon` (lucide name) |
| Doc page | `title`, `slug`, `order` | `description` |
| Blog post | `title`, `slug`, `publishDate` | `excerpt`, `authorName`, `tags`, `featured`, `readingMinutes` |
| Changelog entry | `version`, `releaseDate` | `title`, `tags` |
| Site page | `title`, `slug` | `description` |

The body of every file is standard GitHub-flavored markdown. Code fences are syntax highlighted, and h2/h3 headings automatically appear in the on-page table of contents.

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
