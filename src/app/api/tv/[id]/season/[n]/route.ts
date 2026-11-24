import type { NextRequest } from "next/server";
import { toEpisodeItems } from "@/lib/tmdb/episodes";
import { getSeason } from "@/lib/tmdb/tv";

// GET /api/tv/1396/season/2 → that season's episodes, for the season dropdown.
// The first season shown comes with the page; others load on demand (like Netflix).
// Public data, so browsers and CDNs may cache it for a while.

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/tv/[id]/season/[n]">) {
  const { id: rawId, n: rawSeason } = await ctx.params;
  const id = Number(rawId);
  const seasonNumber = Number(rawSeason);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(seasonNumber) || seasonNumber < 0) {
    return Response.json({ error: "Invalid season" }, { status: 400 });
  }

  try {
    const season = await getSeason(id, seasonNumber);
    if (!season) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(
      { episodes: toEpisodeItems(season) },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
    );
  } catch {
    return Response.json({ error: "Unavailable" }, { status: 502 });
  }
}
