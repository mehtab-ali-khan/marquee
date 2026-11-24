import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TitleProgram } from "@/features/title/TitleProgram";
import { movieProgram } from "@/features/title/program";
import { backdropUrl } from "@/lib/tmdb/images";
import { getMovie } from "@/lib/tmdb/movies";

// The folder name [id] makes this a DYNAMIC route:
//   /movie/550   → params.id = "550"
//   /movie/27205 → params.id = "27205"
// One file serves every movie, like React Router's path="/movie/:id".
// The layout itself (the "Festival Program") lives in features/title and is
// shared with TV shows.

/**
 * Load the movie, or show the 404 page if it doesn't exist.
 * Used by both generateMetadata and the page. getMovie() is cached,
 * so calling it twice still asks TMDB only once.
 */
async function loadMovie(idParam: string) {
  const id = Number(idParam);
  // "/movie/abc" or "/movie/-5": not a valid TMDB id, don't even ask TMDB.
  if (!Number.isInteger(id) || id <= 0) notFound();

  // getMovie returns null when TMDB has no such movie → show our 404 page.
  // Any other problem (TMDB down...) throws → error.tsx with "Try again".
  const movie = await getMovie(id);
  if (!movie) notFound();
  return movie;
}

// Sets the browser tab title and link-preview info per movie,
// e.g. "Fight Club · Marquee" with the backdrop as the preview image.
export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const { id } = await params;
  const movie = await loadMovie(id);
  const image = backdropUrl(movie.backdrop_path, "w1280");

  return {
    title: movie.title,
    description: movie.overview,
    openGraph: { title: movie.title, description: movie.overview, images: image ? [image] : [] },
  };
}

export default async function MoviePage({ params }: PageProps<"/movie/[id]">) {
  const { id } = await params; // params is a Promise in Next 15+, so we await it
  const movie = await loadMovie(id);
  return <TitleProgram program={movieProgram(movie)} />;
}
