import "server-only";
import { tmdbFetch } from "./client";
import { movieToCard, tvToCard, type CardData } from "./cards";
import type { MovieSummary, Paginated, TvSummary } from "./types";

type MediaType = "movie" | "tv";
type Shelf = "watchlist" | "favorite" | "rated";
type Session = { accountId: number; sessionId: string };

/** One saved title: card data, plus what the library needs to remove it again. */
export type LibraryItem = CardData & { type: MediaType; id: number; userRating?: number };
export type LibraryPage = { items: LibraryItem[]; page: number; totalPages: number; totalResults: number };
export type LibraryOverview = Record<Shelf, Record<MediaType, LibraryPage>>;

/** One page (20 titles) of one shelf, newest additions first. Per-user data: never cached across users. */
export async function getLibraryPage(
  { accountId, sessionId }: Session,
  shelf: Shelf,
  type: MediaType,
  page: number,
): Promise<LibraryPage> {
  const path = `/account/${accountId}/${shelf}/${type === "movie" ? "movies" : "tv"}`;
  const params = { session_id: sessionId, page, sort_by: "created_at.desc" };
  const data = type === "movie"
    ? await tmdbFetch<Paginated<MovieSummary & { rating?: number }>>(path, params)
    : await tmdbFetch<Paginated<TvSummary & { rating?: number }>>(path, params);

  return {
    page: data.page,
    totalPages: Math.min(data.total_pages, 500),
    totalResults: data.total_results,
    items: data.results.map((item) => ({
      ...("title" in item ? movieToCard(item) : tvToCard(item)),
      type,
      id: item.id,
      userRating: item.rating,
    })),
  };
}

/**
 * The first page of EVERY shelf (3 shelves × films/series = 6 requests), all at
 * once. They run in parallel, so this takes about as long as the slowest single
 * request, and afterwards switching tabs needs no network at all.
 * It also gives us the counts shown on the tabs.
 */
export async function getLibraryOverview(session: Session): Promise<LibraryOverview> {
  const shelves = ["watchlist", "favorite", "rated"] as const;
  const pages = await Promise.all(
    shelves.flatMap((shelf) => [
      getLibraryPage(session, shelf, "movie", 1),
      getLibraryPage(session, shelf, "tv", 1),
    ]),
  );
  return {
    watchlist: { movie: pages[0], tv: pages[1] },
    favorite: { movie: pages[2], tv: pages[3] },
    rated: { movie: pages[4], tv: pages[5] },
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
