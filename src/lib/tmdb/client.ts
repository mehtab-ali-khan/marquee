// This import is a guard: if any Client Component ever imports this file
// (directly or through another file), the BUILD FAILS. So the token below
// can never end up in browser JavaScript by accident.
import "server-only";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/** Query params we can send to TMDB. `undefined` values are skipped. */
export type TmdbParams = Record<string, string | number | boolean | undefined>;

/**
 * Error thrown when TMDB answers with a non-2xx status.
 * Keeping the status lets callers react properly, e.g. 404 -> show "not found".
 */
export class TmdbError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message: string,
  ) {
    super(`TMDB ${status} on ${path}: ${message}`);
    this.name = "TmdbError";
  }
}

function getToken(): string {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    // Fail loudly with a clear fix, instead of a confusing 401 later.
    throw new Error("TMDB_READ_TOKEN is missing. Add it to .env.local and restart `npm run dev`.");
  }
  return token;
}

/**
 * The ONE place in the app that talks to TMDB.
 *
 *   const movie = await tmdbFetch<Movie>("/movie/550");
 *   const page  = await tmdbFetch<Paginated<Movie>>("/movie/popular", { page: 2 });
 *
 * It adds the base URL, the auth header, default params and error handling.
 * It does NOT cache: caching is decided per endpoint (popular lists can be
 * cached for hours, but a user's watchlist must never be shared between users).
 */
export async function tmdbFetch<T>(
  path: string,
  params: TmdbParams = {},
  // For write requests (login, logout, watchlist...): method + JSON body.
  options: { method?: "GET" | "POST" | "DELETE"; body?: unknown } = {},
): Promise<T> {
  const url = new URL(TMDB_BASE_URL + path);

  // Defaults first, so a caller can override them (e.g. language: "de-DE").
  const allParams: TmdbParams = { language: "en-US", ...params };
  for (const [key, value] of Object.entries(allParams)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
      ...(options.body !== undefined && { "Content-Type": "application/json" }),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    // TMDB sends errors as { status_message: "..." }; fall back to the HTTP text.
    const body = (await res.json().catch(() => null)) as { status_message?: string } | null;
    throw new TmdbError(res.status, path, body?.status_message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}
