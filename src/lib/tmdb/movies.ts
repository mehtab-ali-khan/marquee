import "server-only";
import { cacheLife } from "next/cache";
import { TmdbError, tmdbFetch } from "./client";
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

/**
 * A movie's details barely change, so reuse them for a day.
 * Returns null if TMDB has no movie with this id.
 *
 * Why not just let the 404 error through? Errors that leave a "use cache"
 * function are copied, and the copy is no longer a TmdbError, so callers
 * can't check `instanceof TmdbError`. Deciding "not found" HERE, inside the
 * cached function, avoids that. Other errors (TMDB down) still throw.
 */
export async function getMovie(id: number): Promise<MovieDetails | null> {
  "use cache";
  cacheLife("days");
  try {
    // append_to_response: get details + cast/crew + trailers + streaming services
    // + recommendations in ONE request instead of five separate calls to TMDB.
    return await tmdbFetch<MovieDetails>(`/movie/${id}`, {
      append_to_response: "credits,videos,watch/providers,recommendations",
    });
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}
