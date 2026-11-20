import { redirect } from "next/navigation";

// /title/movie/550 is the URL of the detail MODAL on the home page (intercepted
// by (browse)/@modal/(.)title/movie/[id]). Visited directly (reload, shared
// link), there's no home page underneath, so send people to the full page.

export default async function MovieModalUrl({ params }: PageProps<"/title/movie/[id]">) {
  const { id } = await params;
  redirect(`/movie/${encodeURIComponent(id)}`);
}
