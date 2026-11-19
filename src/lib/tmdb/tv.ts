import "server-only";
import { cacheLife } from "next/cache";
import { TmdbError, tmdbFetch } from "./client";
import type { Paginated, TvDetails, TvSummary } from "./types";

// Same pattern as movies.ts: one small cached function per endpoint.

export async function getPopularTv(page = 1) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<TvSummary>>("/tv/popular", { page });
}

export async function getTopRatedTv(page = 1) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<TvSummary>>("/tv/top_rated", { page });
}

/** Shows with an episode airing in the next 7 days. */
export async function getOnTheAirTv(page = 1) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<TvSummary>>("/tv/on_the_air", { page });
}

/**
 * A show's details, or null if TMDB has no show with this id.
 * Same approach as getMovie: one request with append_to_response, and the
 * 404 is turned into null INSIDE the cached function (errors that leave a
 * "use cache" function lose their TmdbError class).
 * Cached for hours, not days: running shows get new episodes and air dates.
 */
export async function getTvShow(id: number): Promise<TvDetails | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await tmdbFetch<TvDetails>(`/tv/${id}`, {
      append_to_response: "credits,videos,watch/providers,recommendations",
    });
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}
