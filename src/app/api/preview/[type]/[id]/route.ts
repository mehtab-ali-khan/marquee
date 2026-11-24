import type { NextRequest } from "next/server";
import { getCurrentUser, getSessionId } from "@/lib/auth/session";
import { formatRuntime, pickTrailer } from "@/lib/tmdb/details";
import { getTitleState } from "@/lib/tmdb/library";
import { getMovie } from "@/lib/tmdb/movies";
import type { PreviewDetails } from "@/lib/tmdb/preview";
import { getTvShow } from "@/lib/tmdb/tv";

// GET /api/preview/movie/550 → what the hover preview needs beyond the row data.
// The public part comes from getMovie/getTvShow, which are already cached
// (so this is fast). The watchlist state is personal, so the response must
// never be cached by a browser or CDN for other people.

const headers = { "Cache-Control": "private, no-store" };

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/preview/[type]/[id]">) {
  const { type, id: rawId } = await ctx.params;
  const id = Number(rawId);
  if ((type !== "movie" && type !== "tv") || !Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid title" }, { status: 400, headers });
  }

  try {
    const [title, user, sessionId] = await Promise.all([
      type === "movie" ? getMovie(id) : getTvShow(id),
      getCurrentUser(),
      getSessionId(),
    ]);
    if (!title) return Response.json({ error: "Not found" }, { status: 404, headers });

    const facts =
      "runtime" in title
        ? [formatRuntime(title.runtime)]
        : [`${title.number_of_seasons} season${title.number_of_seasons === 1 ? "" : "s"}`];

    const signedIn = Boolean(user && sessionId);
    const state = signedIn ? await getTitleState(sessionId!, type, id).catch(() => null) : null;

    const details: PreviewDetails = {
      facts: facts.filter((fact): fact is string => Boolean(fact)),
      genres: title.genres.slice(0, 3).map((genre) => genre.name),
      trailerKey: pickTrailer(title.videos.results)?.key ?? null,
      library: { signedIn, watchlist: state?.watchlist ?? false },
    };
    return Response.json(details, { headers });
  } catch {
    return Response.json({ error: "Unavailable" }, { status: 502, headers });
  }
}
