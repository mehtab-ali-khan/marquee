// The library's shelves and how they appear in the URL (/library?tab=favorite).
// No "server-only": used by the page, the API route and the client view.

export const shelves = [
  { value: "watchlist", label: "Watchlist" },
  { value: "favorite", label: "Favorites" },
  { value: "rated", label: "Rated" },
] as const;

export type Shelf = (typeof shelves)[number]["value"];
export type LibraryMediaType = "movie" | "tv";

/** URL values are untrusted: anything unknown falls back to the watchlist. */
export function readShelf(tab: unknown): Shelf {
  return shelves.find((shelf) => shelf.value === tab)?.value ?? "watchlist";
}

export function readMediaType(type: unknown): LibraryMediaType {
  return type === "tv" ? "tv" : "movie";
}

export function readPage(page: unknown) {
  const n = typeof page === "string" ? Number(page) : 1;
  return Number.isSafeInteger(n) ? Math.max(1, Math.min(500, n)) : 1;
}
