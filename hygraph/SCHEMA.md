# Hygraph schema

The site reads five models from Hygraph. Recreate them with these fields if
you are setting up a fresh project. Field API ids are camelCase; all `body`
fields are single-line String fields that store Markdown (RichText drops
code fence languages, so Markdown-in-String is deliberate).

## DocSection

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | required, used as title |
| `slug` | String | required, unique |
| `description` | String | one line summary for the docs index |
| `icon` | String | lucide icon name: `rocket`, `layers`, `compass`, `code` |
| `order` | Int | sidebar sort position, lowest first |
| `pages` | Relation | one-to-many reverse side of `DocPage.section` |

## DocPage

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | required, used as title |
| `slug` | String | required, unique |
| `description` | String | SEO description and page subtitle |
| `body` | String | Markdown |
| `order` | Int | sort position within the section |
| `section` | Relation | many-to-one to `DocSection` |

## BlogPost

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | required, used as title |
| `slug` | String | required, unique |
| `excerpt` | String | teaser for the index and link previews |
| `body` | String | Markdown |
| `publishDate` | DateTime | `publishedAt` is reserved by Hygraph |
| `authorName` | String | |
| `tags` | String (list) | |
| `featured` | Boolean | featured posts lead the blog index |
| `readingMinutes` | Int | |

## ChangelogEntry

| Field | Type | Notes |
| --- | --- | --- |
| `version` | String | required, unique, used as title |
| `title` | String | short headline for the release |
| `releaseDate` | Date | |
| `body` | String | Markdown, grouped under Added / Changed / Fixed |
| `tags` | String (list) | change categories shown as badges |

## SitePage

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | required, used as title |
| `slug` | String | required, unique: `contributing`, `privacy`, `terms` |
| `description` | String | SEO description |
| `body` | String | Markdown |

After creating the models, run `npm run seed` to push the content in
`/content` and publish it.
