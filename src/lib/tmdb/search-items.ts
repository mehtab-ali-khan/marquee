// A small, flat shape for one search result, used by the ⌘K palette.
// The route handler converts TMDB's big objects into this before sending
// them to the browser: less data over the network, and the client never
// has to know the movie/TV/person field differences.
// No "server-only": the client imports the TYPE.

import type { MultiResult } from "./types";

export type SearchItem = {
  key: string; // "movie-550"
  href: string; // "/movie/550"
  title: string;
  subtitle: string; // "Film · 1999", "Series · 2008", "Person · Acting"
  imagePath: string | null; // poster or profile path
  kind: "movie" | "tv" | "person";
};

export function toSearchItem(result: MultiResult): SearchItem {
  switch (result.media_type) {
    case "movie":
      return {
        key: `movie-${result.id}`,
        href: `/movie/${result.id}`,
        title: result.title,
        subtitle: ["Film", result.release_date?.slice(0, 4)].filter(Boolean).join(" · "),
        imagePath: result.poster_path,
        kind: "movie",
      };
    case "tv":
      return {
        key: `tv-${result.id}`,
        href: `/tv/${result.id}`,
        title: result.name,
        subtitle: ["Series", result.first_air_date?.slice(0, 4)].filter(Boolean).join(" · "),
        imagePath: result.poster_path,
        kind: "tv",
      };
    case "person":
      return {
        key: `person-${result.id}`,
        href: `/person/${result.id}`,
        title: result.name,
        subtitle: ["Person", result.known_for_department].filter(Boolean).join(" · "),
        imagePath: result.profile_path,
        kind: "person",
      };
  }
}
