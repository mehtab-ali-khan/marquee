import type { Metadata } from "next";
import { DynamicMarker } from "@/components/DynamicMarker";
import { TitleSheet, movieSheet } from "@/features/home/TitleSheet";
import { getMovie } from "@/lib/tmdb/movies";

// INTERCEPTED route: /movie/550 opened by clicking on the home page.
// "(.)movie" = "intercept the `movie` route at the same level". The full page
// at app/movie/[id] is still what a reload or a shared link shows.

async function load(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? getMovie(id) : null; // cached: shared with the full page
}

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const movie = await load((await params).id);
  return { title: movie?.title ?? "Not found" }; // tab title follows the modal, like Netflix
}

export default async function MovieModal({ params }: PageProps<"/movie/[id]">) {
  const movie = await load((await params).id);
  if (!movie) return <p className="p-10 text-fg-muted">This title couldn’t be found.</p>;
  return (
    <>
      <TitleSheet sheet={movieSheet(movie)} />
      {/* Lets generateMetadata (which reads params) stream instead of blocking prefetch. */}
      <DynamicMarker />
    </>
  );
}
