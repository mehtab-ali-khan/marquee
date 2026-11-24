import "server-only";
import { cacheLife } from "next/cache";
import { tmdbFetch } from "./client";
import type { MovieSummary, MultiResult, Paginated, PersonSummary, TvSummary } from "./types";

export type SearchType = "all" | "movie" | "tv" | "person";

const EMPTY_PAGE: Paginated<MultiResult> = {
  page: 1,
  results: [],
  total_pages: 0,
  total_results: 0,
};

/**
 * Search movies, TV and people. type "all" uses TMDB's multi-search; the
 * others use the dedicated endpoints (/search/movie...), which return more
 * results of that kind. Every result gets a media_type label, so callers
 * always receive the same MultiResult shape.
 *
 * The query is part of the cache key, so if two people search "dune"
 * within a few minutes, TMDB is only asked once.
 */
export async function search(query: string, type: SearchType = "all", page = 1) {
  "use cache";
  cacheLife("minutes");

  const trimmed = query.trim();
  if (!trimmed) return EMPTY_PAGE; // don't waste a request on an empty box

  const params = { query: trimmed, page, include_adult: false };

  switch (type) {
    case "all":
      return tmdbFetch<Paginated<MultiResult>>("/search/multi", params);
    case "movie": {
      const data = await tmdbFetch<Paginated<MovieSummary>>("/search/movie", params);
      return { ...data, results: data.results.map((r) => ({ ...r, media_type: "movie" as const })) };
    }
    case "tv": {
      const data = await tmdbFetch<Paginated<TvSummary>>("/search/tv", params);
      return { ...data, results: data.results.map((r) => ({ ...r, media_type: "tv" as const })) };
    }
    case "person": {
      const data = await tmdbFetch<Paginated<PersonSummary>>("/search/person", params);
      return { ...data, results: data.results.map((r) => ({ ...r, media_type: "person" as const })) };
    }
  }
}
