import type { Metadata } from "next";
import { Suspense } from "react";
import { DynamicMarker } from "@/components/DynamicMarker";
import { EpisodesSection, EpisodesSectionSkeleton } from "@/components/media/EpisodesSection";
import { TitleSheet, tvSheet } from "@/features/home/TitleSheet";
import { getTvShow } from "@/lib/tmdb/tv";

// INTERCEPTED route for shows: /title/tv/1396, opened by "More info" in a home-page preview.

async function load(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? getTvShow(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/title/tv/[id]">): Promise<Metadata> {
  const show = await load((await params).id);
  return { title: show?.name ?? "Not found" };
}

export default async function TvModal({ params }: PageProps<"/title/tv/[id]">) {
  const show = await load((await params).id);
  if (!show) return <p className="p-10 text-fg-muted">This title couldn’t be found.</p>;
  return (
    <>
      <TitleSheet sheet={tvSheet(show)}>
        {/* The season's episodes stream in on their own, after the rest of the modal. */}
        <Suspense fallback={<EpisodesSectionSkeleton />}>
          <EpisodesSection show={show} />
        </Suspense>
      </TitleSheet>
      {/* Lets generateMetadata (which reads params) stream instead of blocking prefetch. */}
      <DynamicMarker />
    </>
  );
}
