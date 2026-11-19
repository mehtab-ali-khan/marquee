import "server-only";
import { tmdbFetch } from "./client";
import { movieToCard, tvToCard } from "./cards";
import type { MovieSummary, Paginated, TvSummary } from "./types";

type MediaType = "movie" | "tv";
type Shelf = "watchlist" | "favorite" | "rated";
type Session = { accountId: number; sessionId: string };

export async function getLibraryPage(
  { accountId, sessionId }: Session,
  shelf: Shelf,
  type: MediaType,
  page: number,
) {
  const path = `/account/${accountId}/${shelf}/${type === "movie" ? "movies" : "tv"}`;
  const params = { session_id: sessionId, page, sort_by: "created_at.desc" };
  const data = type === "movie"
    ? await tmdbFetch<Paginated<MovieSummary & { rating?: number }>>(path, params)
    : await tmdbFetch<Paginated<TvSummary & { rating?: number }>>(path, params);

  return {
    totalPages: Math.min(data.total_pages, 500),
    cards: data.results.map((item) => ({
      ...("title" in item ? movieToCard(item) : tvToCard(item)),
      userRating: item.rating,
    })),
  };
}

export async function getTitleState(sessionId: string, type: MediaType, id: number) {
  const state = await tmdbFetch<{
    watchlist: boolean;
    favorite: boolean;
    rated: false | { value: number };
  }>(`/${type}/${id}/account_states`, { session_id: sessionId });

  return { watchlist: state.watchlist, favorite: state.favorite, rating: state.rated ? state.rated.value : 0 };
}

export async function saveTitleState(
  { accountId, sessionId }: Session,
  type: MediaType,
  id: number,
  change: { field: "watchlist" | "favorite"; value: boolean } | { field: "rating"; value: number },
) {
  const params = { session_id: sessionId };
  const result = change.field === "rating"
    ? await tmdbFetch<{ success: boolean }>(`/${type}/${id}/rating`, params,
        change.value === 0 ? { method: "DELETE" } : { method: "POST", body: { value: change.value } })
    : await tmdbFetch<{ success: boolean }>(`/account/${accountId}/${change.field}`, params, {
        method: "POST",
        body: { media_type: type, media_id: id, [change.field]: change.value },
      });

  if (!result.success) throw new Error("TMDB did not accept the library change.");
}
