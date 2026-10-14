#!/usr/bin/env node
/**
 * Validates everything under /content so broken frontmatter, duplicate
 * slugs, or dead internal links fail CI before they ship.
 *
 * Usage: node scripts/validate-content.mjs
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT = path.join(ROOT, "content");
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const errors = [];

function fail(file, message) {
  errors.push(`${path.relative(ROOT, file)}: ${message}`);
}

function read(file) {
  try {
    return matter(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(file, `frontmatter does not parse (${error.message})`);
    return null;
  }
}

function markdownFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(dir, name));
}

function requireFields(file, data, fields) {
  for (const [name, type] of Object.entries(fields)) {
    const value = data[name];
    if (value === undefined || value === null || value === "") {
      fail(file, `missing required frontmatter field "${name}"`);
      continue;
    }
    if (type === "string" && typeof value !== "string") {
      fail(file, `"${name}" must be a string`);
    } else if (type === "number" && typeof value !== "number") {
      fail(file, `"${name}" must be a number`);
    } else if (type === "date" && Number.isNaN(new Date(value).getTime())) {
      fail(file, `"${name}" is not a parseable date`);
    }
  }
}

function checkOptional(file, data, fields) {
  for (const [name, type] of Object.entries(fields)) {
    const value = data[name];
    if (value === undefined) continue;
    if (type === "string" && typeof value !== "string") {
      fail(file, `"${name}" must be a string`);
    } else if (type === "number" && typeof value !== "number") {
      fail(file, `"${name}" must be a number`);
    } else if (type === "boolean" && typeof value !== "boolean") {
      fail(file, `"${name}" must be a boolean`);
    } else if (
      type === "string[]" &&
      (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    ) {
      fail(file, `"${name}" must be a list of strings`);
    }
  }
}

function checkSlug(file, slug) {
  if (typeof slug === "string" && !SLUG_PATTERN.test(slug)) {
    fail(file, `slug "${slug}" is not kebab-case`);
  }
}

function checkUnique(file, map, key, label) {
  if (map.has(key)) {
    fail(file, `duplicate ${label} "${key}" (also in ${map.get(key)})`);
  } else {
    map.set(key, path.relative(ROOT, file));
  }
}

function checkDashes(file, raw) {
  const lines = raw.split("\n");
  lines.forEach((line, index) => {
    if (line.includes("—") || line.includes("–")) {
      fail(file, `line ${index + 1} contains an em or en dash`);
    }
  });
}

/* ---------- Collect and validate every collection ---------- */

const validRoutes = new Set(["/", "/docs", "/changelog"]);
const docSlugs = new Map();
const sectionSlugs = new Map();
const versions = new Map();
const pageSlugs = new Map();
const allFiles = [];

for (const dirent of fs.readdirSync(path.join(CONTENT, "docs"), {
  withFileTypes: true,
})) {
  if (!dirent.isDirectory()) continue;
  const sectionDir = path.join(CONTENT, "docs", dirent.name);
  const sectionFile = path.join(sectionDir, "_section.md");

  if (!fs.existsSync(sectionFile)) {
    fail(sectionDir, "section directory is missing _section.md");
    continue;
  }

  const section = read(sectionFile);
  if (section) {
    allFiles.push({ file: sectionFile, raw: section.content });
    requireFields(sectionFile, section.data, {
      title: "string",
      slug: "string",
      order: "number",
    });
    checkOptional(sectionFile, section.data, {
      description: "string",
      icon: "string",
    });
    checkSlug(sectionFile, section.data.slug);
    checkUnique(sectionFile, sectionSlugs, section.data.slug, "section slug");
    if (section.data.slug !== dirent.name) {
      fail(
        sectionFile,
        `section slug "${section.data.slug}" does not match directory name "${dirent.name}"`,
      );
    }
  }

  for (const file of markdownFiles(sectionDir)) {
    if (path.basename(file) === "_section.md") continue;
    const page = read(file);
    if (!page) continue;
    allFiles.push({ file, raw: page.content });
    requireFields(file, page.data, {
      title: "string",
      slug: "string",
      order: "number",
    });
    checkOptional(file, page.data, { description: "string" });
    checkSlug(file, page.data.slug);
    checkUnique(file, docSlugs, page.data.slug, "doc page slug");
    validRoutes.add(`/docs/${dirent.name}/${page.data.slug}`);
  }
}

for (const file of markdownFiles(path.join(CONTENT, "changelog"))) {
  const entry = read(file);
  if (!entry) continue;
  allFiles.push({ file, raw: entry.content });
  requireFields(file, entry.data, { version: "string", releaseDate: "date" });
  checkOptional(file, entry.data, { title: "string", tags: "string[]" });
  const version = String(entry.data.version);
  if (!VERSION_PATTERN.test(version)) {
    fail(file, `version "${version}" is not semantic (x.y.z)`);
  }
  checkUnique(file, versions, version, "version");
}

for (const file of markdownFiles(path.join(CONTENT, "pages"))) {
  const page = read(file);
  if (!page) continue;
  allFiles.push({ file, raw: page.content });
  requireFields(file, page.data, { title: "string", slug: "string" });
  checkOptional(file, page.data, { description: "string" });
  checkSlug(file, page.data.slug);
  checkUnique(file, pageSlugs, page.data.slug, "site page slug");
  validRoutes.add(`/${page.data.slug}`);
}

/* ---------- Cross-file checks ---------- */

const INTERNAL_LINK = /\]\((\/[^)#\s]*)(#[^)\s]*)?\)/g;

for (const { file, raw } of allFiles) {
  checkDashes(file, raw);
  for (const match of raw.matchAll(INTERNAL_LINK)) {
    const target = match[1].replace(/\/$/, "") || "/";
    if (!validRoutes.has(target)) {
      fail(file, `internal link points to unknown route "${target}"`);
    }
  }
}

/* ---------- Report ---------- */

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log(
  `Content OK: ${docSlugs.size} doc pages in ${sectionSlugs.size} sections, ` +
    `${versions.size} releases, ${pageSlugs.size} site pages.`,
);
