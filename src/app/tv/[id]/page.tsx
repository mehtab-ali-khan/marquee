import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EpisodesSection, EpisodesSectionSkeleton } from "@/components/media/EpisodesSection";
import { TitleProgram } from "@/features/title/TitleProgram";
import { tvProgram } from "@/features/title/program";
import { backdropUrl } from "@/lib/tmdb/images";
import { getTvShow } from "@/lib/tmdb/tv";

// /tv/1396 → Breaking Bad. Same "Festival Program" layout as movies, plus an
// Episodes chapter.

/** Load the show, or show the 404 page if it doesn't exist. */
async function loadShow(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const show = await getTvShow(id);
  if (!show) notFound();
  return show;
}

export async function generateMetadata({ params }: PageProps<"/tv/[id]">): Promise<Metadata> {
  const { id } = await params;
  const show = await loadShow(id);
  const image = backdropUrl(show.backdrop_path, "w1280");

  return {
    title: show.name,
    description: show.overview,
    openGraph: { title: show.name, description: show.overview, images: image ? [image] : [] },
  };
}

export default async function TvPage({ params }: PageProps<"/tv/[id]">) {
  const { id } = await params;
  const show = await loadShow(id);

  return (
    <TitleProgram
      program={tvProgram(show)}
      episodes={
        // The first season streams in on its own, after the rest of the page.
        <Suspense fallback={<EpisodesSectionSkeleton />}>
          <EpisodesSection show={show} showHeading={false} />
        </Suspense>
      }
    />
  );
}
