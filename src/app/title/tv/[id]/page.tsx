import { redirect } from "next/navigation";

// See title/movie/[id]: the modal's URL, visited directly → the full page.

export default async function TvModalUrl({ params }: PageProps<"/title/tv/[id]">) {
  const { id } = await params;
  redirect(`/tv/${encodeURIComponent(id)}`);
}
