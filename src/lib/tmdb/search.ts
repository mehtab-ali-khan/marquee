import "server-only";
import { cacheLife } from "next/cache";
import { tmdbFetch } from "./client";
import type { MultiResult, Paginated } from "./types";

const EMPTY_PAGE: Paginated<MultiResult> = {
  page: 1,
  results: [],
  total_pages: 0,
  total_results: 0,
};

/**
 * Search movies, TV shows and people at once ("multi" search).
 * The query is part of the cache key, so if two people search "dune"
 * within a few minutes, TMDB is only asked once.
 */
export async function searchMulti(query: string, page = 1) {
  "use cache";
  cacheLife("minutes");

  const trimmed = query.trim();
  // Don't waste a request on an empty search box.
  if (!trimmed) return EMPTY_PAGE;

  return tmdbFetch<Paginated<MultiResult>>("/search/multi", {
    query: trimmed,
    page,
    include_adult: false,
  });
}
