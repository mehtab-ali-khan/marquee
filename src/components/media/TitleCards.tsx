import type { MovieSummary, TvSummary } from "@/lib/tmdb/types";
import { MediaCard } from "./MediaCard";

// Small "translator" components: they take a TMDB object and pass the right
// fields to the generic MediaCard. This is the ONE place that knows a movie
// uses `title` / `release_date` while TV uses `name` / `first_air_date`.
//
// Pages can now write <MovieCard movie={movie} /> instead of 6 props every time.

export function MovieCard({ movie }: { movie: MovieSummary }) {
  return (
    <MediaCard
      href={`/movie/${movie.id}`}
      title={movie.title}
      posterPath={movie.poster_path}
      year={movie.release_date?.slice(0, 4)}
      rating={movie.vote_average}
    />
  );
}

export function TvCard({ show }: { show: TvSummary }) {
  return (
    <MediaCard
      href={`/tv/${show.id}`}
      title={show.name}
      posterPath={show.poster_path}
      year={show.first_air_date?.slice(0, 4)}
      rating={show.vote_average}
    />
  );
}
