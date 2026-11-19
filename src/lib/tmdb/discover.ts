import "server-only";
import { cacheLife } from "next/cache";
import { movieToCard, tvToCard, type CardData } from "./cards";
import { tmdbFetch } from "./client";
import type { DiscoverFilters } from "./discover-params";
import type { Genre, MovieSummary, Paginated, TvSummary } from "./types";

/** The list of genres (ids + names) for movies or TV. Almost never changes. */
export async function getGenres(type: "movie" | "tv") {
  "use cache";
  cacheLife("weeks");
  const data = await tmdbFetch<{ genres: Genre[] }>(`/genre/${type}/list`);
  return data.genres;
}

/**
 * Browse titles with filters, one page (20 titles) at a time.
 * Returns ready-to-render card data plus paging info.
 * The filters and page are the cache key: the same filtered page is
 * fetched from TMDB at most once an hour.
 */
export async function discover(filters: DiscoverFilters, page = 1) {
  "use cache";
  cacheLife("hours");

  const isMovie = filters.type === "movie";
  // Movies and TV name their date field differently.
  const dateField = isMovie ? "primary_release_date" : "first_air_date";

  const params: Record<string, string | number | boolean | undefined> = {
    page,
    include_adult: false,
    with_genres: filters.genre ?? undefined,
    // Ratings from a handful of votes are meaningless (a 10/10 from 2 people),
    // so "rating" filters and the "Highest rated" sort only count well-voted titles.
    // Other non-popularity sorts get a small minimum to hide obscure entries.
    "vote_average.gte": filters.rating ?? undefined,
    "vote_count.gte": filters.rating || filters.sort === "top" ? 200 : filters.sort === "popular" ? undefined : 50,
  };

  if (filters.decade) {
    // 1960 means "before 1970"; other decades are 10-year windows.
    if (filters.decade !== 1960) params[`${dateField}.gte`] = `${filters.decade}-01-01`;
    params[`${dateField}.lte`] = `${filters.decade + 9}-12-31`;
  }

  params.sort_by = {
    popular: "popularity.desc",
    top: "vote_average.desc",
    newest: `${dateField}.desc`,
    az: isMovie ? "title.asc" : "name.asc",
  }[filters.sort];

  if (isMovie) {
    const data = await tmdbFetch<Paginated<MovieSummary>>("/discover/movie", params);
    return toResult(data, data.results.map(movieToCard));
  }
  const data = await tmdbFetch<Paginated<TvSummary>>("/discover/tv", params);
  return toResult(data, data.results.map(tvToCard));
}

function toResult(data: Paginated<unknown>, items: CardData[]) {
  return {
    items,
    page: data.page,
    totalPages: Math.min(data.total_pages, 500),
    totalResults: data.total_results,
  };
}
