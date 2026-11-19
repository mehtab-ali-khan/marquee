// Discover filters <-> URL. Shared by the page, the API route and the
// client filter panel, so all three agree on names and defaults.
// No "server-only": pure functions, no secrets.

export type MediaType = "movie" | "tv";
export type SortKey = "popular" | "top" | "newest" | "az";

export type DiscoverFilters = {
  type: MediaType;
  genre: number | null; // TMDB genre id, e.g. 28 = Action
  decade: number | null; // 1990 = the 1990s; 1960 = "before 1970"
  rating: number | null; // minimum average, e.g. 7
  sort: SortKey;
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "top", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A–Z" },
];

export const DECADE_OPTIONS = [2020, 2010, 2000, 1990, 1980, 1970, 1960];
export const RATING_OPTIONS = [6, 7, 8];

export function decadeLabel(decade: number) {
  return decade === 1960 ? "Before 1970" : `${decade}s`;
}

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

/** URL values are untrusted strings: turn them into safe, typed filters. */
export function parseDiscoverParams(raw: RawParams): DiscoverFilters & { page: number } {
  const get = (key: string) => {
    const v = raw instanceof URLSearchParams ? raw.get(key) : raw[key];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const toInt = (value: string) => (/^\d+$/.test(value) ? Number(value) : null);

  const genre = toInt(get("genre"));
  const decade = toInt(get("decade"));
  const rating = toInt(get("rating"));
  const page = toInt(get("page"));
  const sort = get("sort");

  return {
    type: get("type") === "tv" ? "tv" : "movie",
    genre,
    decade: decade !== null && DECADE_OPTIONS.includes(decade) ? decade : null,
    rating: rating !== null && RATING_OPTIONS.includes(rating) ? rating : null,
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : "popular",
    page: page && page <= 500 ? page : 1, // TMDB stops at page 500
  };
}

/** Filters → "type=tv&genre=18" (defaults left out so URLs stay short). */
export function toDiscoverQuery(filters: DiscoverFilters, page = 1) {
  const sp = new URLSearchParams();
  if (filters.type !== "movie") sp.set("type", filters.type);
  if (filters.genre) sp.set("genre", String(filters.genre));
  if (filters.decade) sp.set("decade", String(filters.decade));
  if (filters.rating) sp.set("rating", String(filters.rating));
  if (filters.sort !== "popular") sp.set("sort", filters.sort);
  if (page > 1) sp.set("page", String(page));
  return sp.toString();
}
