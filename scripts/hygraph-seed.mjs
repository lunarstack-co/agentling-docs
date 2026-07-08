#!/usr/bin/env node
/**
 * Idempotent seed script: upserts the markdown content in /content into
 * Hygraph and publishes it. Safe to run repeatedly.
 *
 * Required environment (read from the shell or .env.local):
 *   HYGRAPH_CONTENT_API  Content API endpoint of your Hygraph environment.
 *   HYGRAPH_TOKEN        A Permanent Auth Token with content create/update
 *                        and publish permissions on all site models.
 *
 * Usage: node scripts/hygraph-seed.mjs [--dry-run]
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT = path.join(ROOT, "content");
const DRY_RUN = process.argv.includes("--dry-run");

loadEnvFile(path.join(ROOT, ".env.local"));

const endpoint = process.env.HYGRAPH_CONTENT_API;
const token = process.env.HYGRAPH_TOKEN;

if (!endpoint || !token) {
  console.error(
    "Missing HYGRAPH_CONTENT_API or HYGRAPH_TOKEN. Set them in .env.local or the shell.",
  );
  process.exit(1);
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function readMarkdown(file) {
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { ...data, body: content.trim() };
}

function readDir(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => readMarkdown(path.join(dir, name)));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Free-tier Hygraph rate limits are easy to hit while seeding, so every
// request is paced and retried with exponential backoff on 429s.
const PACE_MS = 400;
const MAX_ATTEMPTS = 6;

async function gql(query, variables) {
  if (DRY_RUN) return {};
  for (let attempt = 1; ; attempt += 1) {
    await sleep(PACE_MS);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json().catch(() => ({}));
    const messages = (json.errors ?? []).map((error) => error.message);
    const rateLimited =
      response.status === 429 ||
      messages.some((message) => /too many requests/i.test(message));
    if (rateLimited && attempt < MAX_ATTEMPTS) {
      const delay = 1000 * 2 ** attempt;
      console.log(`  rate limited, retrying in ${delay / 1000}s...`);
      await sleep(delay);
      continue;
    }
    if (messages.length) throw new Error(messages.join("; "));
    return json.data;
  }
}

async function upsertAndPublish(model, where, create, update) {
  const upper = model[0].toUpperCase() + model.slice(1);
  await gql(
    `mutation Upsert($where: ${upper}WhereUniqueInput!, $create: ${upper}CreateInput!, $update: ${upper}UpdateInput!) {
      upsert${upper}(where: $where, upsert: { create: $create, update: $update }) { id }
    }`,
    { where, create, update },
  );
  await gql(
    `mutation Publish($where: ${upper}WhereUniqueInput!) {
      publish${upper}(where: $where, to: PUBLISHED) { id }
    }`,
    { where },
  );
}

async function seedDocs() {
  const docsDir = path.join(CONTENT, "docs");
  const sectionDirs = fs
    .readdirSync(docsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  let pageCount = 0;
  for (const dir of sectionDirs) {
    const sectionPath = path.join(docsDir, dir.name);
    const section = readMarkdown(path.join(sectionPath, "_section.md"));
    const sectionData = {
      title: section.title,
      slug: section.slug,
      description: section.description ?? null,
      icon: section.icon ?? null,
      order: section.order ?? 0,
    };
    await upsertAndPublish(
      "docSection",
      { slug: section.slug },
      sectionData,
      sectionData,
    );

    const pages = fs
      .readdirSync(sectionPath)
      .filter((name) => name.endsWith(".md") && name !== "_section.md")
      .map((name) => readMarkdown(path.join(sectionPath, name)));

    for (const page of pages) {
      const pageData = {
        title: page.title,
        slug: page.slug,
        description: page.description ?? null,
        body: page.body,
        order: page.order ?? 0,
        section: { connect: { slug: section.slug } },
      };
      await upsertAndPublish(
        "docPage",
        { slug: page.slug },
        pageData,
        pageData,
      );
      pageCount += 1;
    }
    console.log(`✓ docs/${section.slug} (${pages.length} pages)`);
  }
  return { sections: sectionDirs.length, pages: pageCount };
}

async function seedBlog() {
  const posts = readDir(path.join(CONTENT, "blog"));
  for (const post of posts) {
    const data = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? null,
      body: post.body,
      publishDate: post.publishDate ?? null,
      authorName: post.authorName ?? null,
      tags: post.tags ?? [],
      featured: post.featured ?? false,
      readingMinutes: post.readingMinutes ?? null,
    };
    await upsertAndPublish("blogPost", { slug: post.slug }, data, data);
    console.log(`✓ blog/${post.slug}`);
  }
  return posts.length;
}

async function seedChangelog() {
  const entries = readDir(path.join(CONTENT, "changelog"));
  for (const entry of entries) {
    const data = {
      version: String(entry.version),
      title: entry.title ?? null,
      releaseDate: entry.releaseDate
        ? new Date(entry.releaseDate).toISOString().slice(0, 10)
        : null,
      body: entry.body,
      tags: entry.tags ?? [],
    };
    await upsertAndPublish(
      "changelogEntry",
      { version: String(entry.version) },
      data,
      data,
    );
    console.log(`✓ changelog/${entry.version}`);
  }
  return entries.length;
}

async function seedPages() {
  const pages = readDir(path.join(CONTENT, "pages"));
  for (const page of pages) {
    const data = {
      title: page.title,
      slug: page.slug,
      description: page.description ?? null,
      body: page.body,
    };
    await upsertAndPublish("sitePage", { slug: page.slug }, data, data);
    console.log(`✓ pages/${page.slug}`);
  }
  return pages.length;
}

const docs = await seedDocs();
const posts = await seedBlog();
const releases = await seedChangelog();
const pages = await seedPages();

console.log(
  `\nSeed complete${DRY_RUN ? " (dry run)" : ""}: ${docs.sections} sections, ${docs.pages} doc pages, ${posts} posts, ${releases} releases, ${pages} site pages.`,
);
