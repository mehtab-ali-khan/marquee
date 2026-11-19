// Shapes of the data TMDB sends back.
// No logic here, only descriptions, so TypeScript can autocomplete fields
// and catch typos like `movie.titel`.
//
// We only list the fields we actually use. TMDB sends more, and that's fine:
// TypeScript simply won't know about the extra ones.

/** Every list endpoint (popular, search, discover...) wraps results like this. */
export type Paginated<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type Genre = {
  id: number;
  name: string;
};

/** A movie as it appears in lists (cards, rails, search results). */
export type MovieSummary = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null; // null = TMDB has no poster for this movie
  backdrop_path: string | null;
  release_date: string; // "2024-07-17" (can be "" if unknown)
  vote_average: number; // 0–10
  vote_count: number;
  genre_ids: number[];
};

/**
 * A movie on its detail page. TMDB sends MORE fields here, and full genre
 * objects instead of genre ids. `Omit` removes genre_ids, `&` adds the rest.
 */
export type MovieDetails = Omit<MovieSummary, "genre_ids"> & {
  genres: Genre[];
  runtime: number | null; // minutes
  tagline: string | null;
  status: string; // "Released", "In Production"...
  imdb_id: string | null;
};

/** A TV show as it appears in lists. Note: `name` instead of `title`. */
export type TvSummary = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
};

/** A person as it appears in lists (cast rows, search results). */
export type PersonSummary = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string; // "Acting", "Directing"...
};

/**
 * Mixed lists (trending "all", multi-search) contain movies, TV shows AND
 * people together. Each item carries a `media_type` label saying which one
 * it is. Checking that label tells TypeScript which fields exist:
 *   if (item.media_type === "movie") item.title   // ✅ a movie has title
 */
export type MultiResult =
  | (MovieSummary & { media_type: "movie" })
  | (TvSummary & { media_type: "tv" })
  | (PersonSummary & { media_type: "person" });
