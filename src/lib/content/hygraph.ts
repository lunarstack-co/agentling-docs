/**
 * Minimal Hygraph Content API client. Credentials are read lazily so the
 * app builds and runs with no environment configured; callers treat a null
 * response as "CMS unavailable" and fall back to the bundled seed content.
 */

function endpoint(): string | undefined {
  return process.env.HYGRAPH_CONTENT_API;
}

function token(): string | undefined {
  return process.env.HYGRAPH_TOKEN;
}

export function hygraphConfigured(): boolean {
  return Boolean(endpoint());
}

export async function hygraphRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T | null> {
  const url = endpoint();
  if (!url) return null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = token();
    if (auth) headers.Authorization = `Bearer ${auth}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.warn(`Hygraph responded with ${response.status}; using seed content.`);
      return null;
    }

    const json = (await response.json()) as {
      data?: T;
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      console.warn(`Hygraph query failed: ${json.errors[0].message}; using seed content.`);
      return null;
    }

    return json.data ?? null;
  } catch (error) {
    console.warn(`Hygraph unreachable (${String(error)}); using seed content.`);
    return null;
  }
}
