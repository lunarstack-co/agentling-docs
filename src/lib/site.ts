export const SITE_NAME = "Agentling";
/** Latest released version, shown in the header. */
export const VERSION = "0.1.1";
export const SITE_TAGLINE =
  "An async Python agent loop you can read in an afternoon. Typed memory, streamed events, and tools that are plain functions.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agentling.dev";
export const GITHUB_URL = "https://github.com/lunarstack-co/agentling";
export const GITHUB_DOCS_URL = "https://github.com/lunarstack-co/agentling-docs";
export const PYPI_URL = "https://pypi.org/project/agentling/";

/** The organisation that publishes the project. */
export const ORG = {
  name: "Lunarstack",
  github: "https://github.com/lunarstack-co",
};

export const AUTHOR = {
  name: "Folarin Akinloye",
  role: "Creator of agentling",
  url: "https://folarin.dev",
  github: "https://github.com/folathecoder",
  linkedin: "https://www.linkedin.com/in/akinloye-folarin/",
};

/**
 * schema.org Person for JSON-LD. The sameAs links tie the author entity
 * to the same person across the web, which is how search engines learn
 * who created the project.
 */
export const PERSON_ID = `${SITE_URL}/creator#person`;

export const AUTHOR_JSON_LD = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: AUTHOR.name,
  url: AUTHOR.url,
  sameAs: [AUTHOR.github, AUTHOR.linkedin, AUTHOR.url],
};
