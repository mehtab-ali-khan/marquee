export const shelves = [
  { value: "watchlist", label: "Watchlist" },
  { value: "favorite", label: "Favorites" },
  { value: "rated", label: "Rated" },
] as const;

export type LibrarySelection = {
  tab: (typeof shelves)[number]["value"];
  type: "movie" | "tv";
  page: number;
};

export function readLibrarySelection({ tab, type, page }: {
  tab?: unknown;
  type?: unknown;
  page?: unknown;
}): LibrarySelection {
  const pageNumber = typeof page === "string" ? Number(page) : 1;

  return {
    tab: shelves.find((shelf) => shelf.value === tab)?.value ?? "watchlist",
    type: type === "tv" ? "tv" : "movie",
    page: Number.isSafeInteger(pageNumber) ? Math.max(1, Math.min(500, pageNumber)) : 1,
  };
}

export function libraryQuery({ tab, type, page }: LibrarySelection) {
  const query = new URLSearchParams({ tab, type });
  if (page > 1) query.set("page", String(page));
  return query.toString();
}
