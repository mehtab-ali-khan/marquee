// Turns TMDB movies/shows into the small props MediaCard needs.
// Used where card data must travel to the BROWSER (infinite scroll), so we
// send 5 small fields per title instead of TMDB's ~15.
// No "server-only": pure functions.

import type { MovieSummary, TvSummary } from "./types";

export type CardData = {
  key: string; // "movie-550"
  href: string;
  title: string;
  posterPath: string | null;
  year?: string;
  rating?: number;
};

export function movieToCard(movie: MovieSummary): CardData {
  return {
    key: `movie-${movie.id}`,
    href: `/movie/${movie.id}`,
    title: movie.title,
    posterPath: movie.poster_path,
    year: movie.release_date?.slice(0, 4),
    rating: movie.vote_average,
  };
}

export function tvToCard(show: TvSummary): CardData {
  return {
    key: `tv-${show.id}`,
    href: `/tv/${show.id}`,
    title: show.name,
    posterPath: show.poster_path,
    year: show.first_air_date?.slice(0, 4),
    rating: show.vote_average,
  };
}
