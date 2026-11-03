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

// Search-result lengths: the title template appends " | Agentling" (12 chars).
const TITLE_SUFFIX = 12;
function checkMetaLengths(file, data) {
  if (typeof data.metaTitle === "string" && data.metaTitle.length + TITLE_SUFFIX > 60) {
    fail(file, `metaTitle is ${data.metaTitle.length + TITLE_SUFFIX} chars with the suffix; keep it at 60 or under`);
  }
  if (typeof data.metaDescription === "string" && data.metaDescription.length > 155) {
    fail(file, `metaDescription is ${data.metaDescription.length} chars; keep it at 155 or under`);
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

/** Lines the frontmatter takes up, so reported line numbers match the file. */
function frontmatterLines(file, raw) {
  return fs.readFileSync(file, "utf8").split("\n").length - raw.split("\n").length;
}

function checkDashes(file, raw) {
  const offset = frontmatterLines(file, raw);
  const lines = raw.split("\n");
  lines.forEach((line, index) => {
    if (line.includes("—") || line.includes("–")) {
      fail(file, `line ${index + offset + 1} contains an em or en dash`);
    }
  });
}

/* ---------- Prose checks ---------- */

// Agentling is an engine. The migration page may say what it used to be called.
const FRAMEWORK_ALLOWED = new Set(["content/docs/how-to/migrate-from-0-1.md"]);

// Stock phrasing that reads as filler. Matched case-insensitively outside code.
const BANNED = [
  /\bdelve\b/,
  /\bleverag(e|es|ed|ing)\b/,
  /\bseamless(ly)?\b/,
  /\brobust\b/,
  /\bpowerful\b/,
  /\bcrucial\b/,
  /\bpivotal\b/,
  /\blandscape\b/,
  /\btestament\b/,
  /\bunderscore(s|d)?\b/,
  /\bshowcas(e|es|ed|ing)\b/,
  /\bvibrant\b/,
  /\btapestry\b/,
  /\bharness(es|ed|ing)? (the|its|their|your|this|that)\b/,
  /\blet's dive\b/,
  /\bin order to\b/,
  /\bit is important to note\b/,
];

// Words that keep their capitals in a sentence-case heading.
const HEADING_ALLOWLIST = new Set([
  "Agentling",
  "Python",
  "OpenAI",
  "Anthropic",
  "Ollama",
  "LM",
  "Studio",
  "JSON",
  "Schema",
  "API",
  "MCP",
  "GitHub",
  "PyPI",
  "SKILL.md",
  "UI",
  "SSE",
  "HTTP",
  "CI",
  "Claude",
  "Aldwin",
  "I",
]);

const UNPINNED = /github\.com\/lunarstack-co\/agentling\/(blob|tree)\/main\//;

/** The prose lines of a Markdown body, with their 1-based line numbers. */
function proseLines(raw) {
  const out = [];
  let fenced = false;
  raw.split("\n").forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return;
    }
    if (!fenced) out.push({ line, number: index + 1 });
  });
  return out;
}

function checkProse(file, raw) {
  const relative = path.relative(ROOT, file);
  const offset = frontmatterLines(file, raw);
  for (const { line, number: bodyLine } of proseLines(raw)) {
    const number = bodyLine + offset;
    const text = line.replace(/`[^`]*`/g, "");
    if (/framework/i.test(text) && !FRAMEWORK_ALLOWED.has(relative)) {
      fail(file, `line ${number} says "framework"; Agentling is an agent engine`);
    }
    for (const pattern of BANNED) {
      const match = text.toLowerCase().match(pattern);
      if (match) fail(file, `line ${number} uses "${match[0]}"; say it plainly`);
    }
    if (UNPINNED.test(line)) {
      fail(file, `line ${number} links the agentling repo at main; pin it to the release tag`);
    }
    const heading = text.match(/^#{1,6}\s+(.*)$/);
    if (heading) checkHeadingCase(file, number, heading[1]);
  }
}

function checkHeadingCase(file, number, heading) {
  const words = heading
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .split(/\s+/)
    .slice(1)
    .map((word) => word.replace(/^[^\w]+|[^\w.]+$/g, ""))
    .filter((word) => /^[A-Z][a-z]/.test(word) && !HEADING_ALLOWLIST.has(word));
  if (words.length >= 2) {
    fail(file, `line ${number} heading is in title case ("${heading}"); use sentence case`);
  }
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
    checkOptional(file, page.data, {
      description: "string",
      metaTitle: "string",
      metaDescription: "string",
    });
    checkMetaLengths(file, page.data);
    checkSlug(file, page.data.slug);
    // Routes are /docs/<section>/<slug>, so a slug need only be unique in its section.
    checkUnique(file, docSlugs, `${dirent.name}/${page.data.slug}`, "doc page");
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
  checkOptional(file, page.data, {
    description: "string",
    metaTitle: "string",
    metaDescription: "string",
  });
  checkMetaLengths(file, page.data);
  checkSlug(file, page.data.slug);
  checkUnique(file, pageSlugs, page.data.slug, "site page slug");
  validRoutes.add(`/${page.data.slug}`);
}

/* ---------- Cross-file checks ---------- */

const INTERNAL_LINK = /\]\((\/[^)#\s]*)(#[^)\s]*)?\)/g;

for (const { file, raw } of allFiles) {
  checkDashes(file, raw);
  checkProse(file, raw);
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
