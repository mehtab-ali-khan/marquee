import "server-only";
import { cacheLife } from "next/cache";
import { tmdbFetch } from "./client";
import type { Paginated, TvSummary } from "./types";

// Same pattern as movies.ts: one small cached function per endpoint.
// (TV details, seasons and episodes come in step 7, with the detail pages.)

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
