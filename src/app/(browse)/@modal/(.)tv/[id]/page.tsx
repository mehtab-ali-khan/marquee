import type { Metadata } from "next";
import { TitleSheet, tvSheet } from "@/features/home/TitleSheet";
import { getTvShow } from "@/lib/tmdb/tv";

// INTERCEPTED route for shows: /tv/1396 opened from the home page.
// (The episode list is added here in the next phase.)

async function load(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? getTvShow(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/tv/[id]">): Promise<Metadata> {
  const show = await load((await params).id);
  return { title: show?.name ?? "Not found" };
}

export default async function TvModal({ params }: PageProps<"/tv/[id]">) {
  const show = await load((await params).id);
  if (!show) return <p className="p-10 text-fg-muted">This title couldn’t be found.</p>;
  return <TitleSheet sheet={tvSheet(show)} />;
}
