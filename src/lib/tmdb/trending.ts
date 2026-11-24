import "server-only";
import { cacheLife } from "next/cache";
import { tmdbFetch } from "./client";
import type { MovieSummary, MultiResult, Paginated, TvSummary } from "./types";

// What people are watching right now. TMDB offers two time windows:
// "day" (today's buzz) and "week" (steadier, less noisy).
type TimeWindow = "day" | "week";

export async function getTrendingMovies(window: TimeWindow = "week") {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<MovieSummary>>(`/trending/movie/${window}`);
}

export async function getTrendingTv(window: TimeWindow = "week") {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<TvSummary>>(`/trending/tv/${window}`);
}

/** Movies, TV and people mixed together. Used for the home page hero. */
export async function getTrendingAll(window: TimeWindow = "day") {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<MultiResult>>(`/trending/all/${window}`);
}
