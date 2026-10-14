import { execFileSync } from "node:child_process";

export interface FileDates {
  /** ISO date of the commit that created the file. */
  published: string;
  /** ISO date of the last commit that touched the file. */
  modified: string;
}

const cache = new Map<string, FileDates>();

/**
 * Publication and modification dates for a content file, taken from git
 * so they change only when the file does. Falls back to the build time
 * when git or the history is unavailable (for example a shallow clone
 * without the file's first commit, or a tarball build).
 */
export function getFileDates(file: string): FileDates {
  const cached = cache.get(file);
  if (cached) return cached;

  let dates: FileDates;
  try {
    const output = execFileSync(
      "git",
      ["log", "--follow", "--format=%cI", "--", file],
      { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    if (output.length === 0) throw new Error("no history");
    dates = { modified: output[0], published: output[output.length - 1] };
  } catch {
    const now = new Date().toISOString();
    dates = { modified: now, published: now };
  }

  cache.set(file, dates);
  return dates;
}
