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

/** An actor in a movie/show's cast. `order` 0 = top-billed. */
export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

/** Someone behind the camera. We use it to find the director. */
export type CrewMember = {
  id: number;
  name: string;
  job: string; // "Director", "Screenplay", "Original Music Composer"...
};

/** A trailer/teaser/clip. `key` is the YouTube video id. */
export type Video = {
  id: string;
  key: string;
  name: string;
  site: string; // "YouTube", "Vimeo"
  type: string; // "Trailer", "Teaser", "Clip"...
  official: boolean;
};

/** A streaming/rental service, e.g. Netflix or Apple TV. */
export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number; // lower = more prominent
};

/**
 * Where a title is available in ONE country. Each group is optional:
 * flatrate = included in a subscription, ads = free with ads, rent, buy.
 */
export type WatchProviderRegion = {
  link: string; // TMDB page listing all options for this country
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

/**
 * A movie on its detail page. TMDB sends MORE fields here, and full genre
 * objects instead of genre ids. `Omit` removes genre_ids, `&` adds the rest.
 * `credits` and `videos` are included because we ask for them with
 * append_to_response (see getMovie).
 */
export type MovieDetails = Omit<MovieSummary, "genre_ids"> & {
  genres: Genre[];
  runtime: number | null; // minutes
  tagline: string | null;
  status: string; // "Released", "In Production"...
  imdb_id: string | null;
  credits: { cast: CastMember[]; crew: CrewMember[] };
  videos: { results: Video[] };
  // Keyed by country code: results.US, results.PK, results.DE...
  "watch/providers": { results: Record<string, WatchProviderRegion> };
  recommendations: Paginated<MovieSummary>;
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

/** One season of a show, as listed on the show's page (no episodes yet). */
export type SeasonSummary = {
  id: number;
  season_number: number; // 0 = "Specials" (extras, not a real season)
  name: string; // "Season 1"
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
};

/** One episode, as listed in a season. */
export type Episode = {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  runtime: number | null; // minutes
  still_path: string | null; // a frame from the episode (16:9)
  air_date: string | null;
};

/** A season with its episodes (/tv/{id}/season/{n}). */
export type SeasonDetails = {
  id: number;
  season_number: number;
  name: string;
  episodes: Episode[];
};

/**
 * A TV show on its detail page. Same idea as MovieDetails: the list fields,
 * plus show-only fields (seasons, creators), plus everything we request
 * with append_to_response.
 */
export type TvDetails = Omit<TvSummary, "genre_ids"> & {
  genres: Genre[];
  tagline: string | null;
  status: string; // "Returning Series", "Ended", "Canceled"
  last_air_date: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  created_by: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  seasons: SeasonSummary[];
  /** The most recently aired episode: which season the episode list opens on. */
  last_episode_to_air: { season_number: number } | null;
  credits: { cast: CastMember[]; crew: CrewMember[] };
  videos: { results: Video[] };
  "watch/providers": { results: Record<string, WatchProviderRegion> };
  recommendations: Paginated<TvSummary>;
};

/** A person as it appears in lists (cast rows, search results). */
export type PersonSummary = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string; // "Acting", "Directing"...
};

/**
 * One entry in a person's filmography: a movie OR a show, plus their role in it.
 * Same "label" idea as MultiResult: check media_type to know which fields exist.
 */
export type PersonCastCredit =
  | (MovieSummary & { media_type: "movie"; credit_id: string; character: string })
  | (TvSummary & { media_type: "tv"; credit_id: string; character: string; episode_count: number });

/** Behind-the-camera work (directing, producing, writing...). */
export type PersonCrewCredit =
  | (MovieSummary & { media_type: "movie"; credit_id: string; job: string })
  | (TvSummary & { media_type: "tv"; credit_id: string; job: string });

/** A person's page. combined_credits = movies AND TV in one list (append_to_response). */
export type PersonDetails = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null; // "1956-03-07"
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string; // "Acting", "Directing"...
  imdb_id: string | null;
  combined_credits: { cast: PersonCastCredit[]; crew: PersonCrewCredit[] };
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
