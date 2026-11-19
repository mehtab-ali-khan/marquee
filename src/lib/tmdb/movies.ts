import "server-only";
import { cacheLife } from "next/cache";
import { tmdbFetch } from "./client";
import type { MovieDetails, MovieSummary, Paginated } from "./types";

// One small function per TMDB endpoint.
// Pages call THESE, never tmdbFetch directly, so pages don't need to know
// URLs, types or cache rules. They just ask: getPopularMovies().
//
// Each function says how long its answer can be reused ("use cache" + cacheLife).
// The arguments (page, id) are part of the cache key automatically:
// getMovie(550) and getMovie(551) are remembered separately.

/** Lists change during the day, so reuse them for about an hour. */
export async function getPopularMovies(page = 1) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<MovieSummary>>("/movie/popular", { page });
}

export async function getTopRatedMovies(page = 1) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<MovieSummary>>("/movie/top_rated", { page });
}

export async function getNowPlayingMovies(page = 1) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<MovieSummary>>("/movie/now_playing", { page });
}

export async function getUpcomingMovies(page = 1) {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<Paginated<MovieSummary>>("/movie/upcoming", { page });
}

/** A movie's details barely change, so reuse them for a day. */
export async function getMovie(id: number) {
  "use cache";
  cacheLife("days");
  return tmdbFetch<MovieDetails>(`/movie/${id}`);
}
