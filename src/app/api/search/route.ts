import type { NextRequest } from "next/server";
import { search } from "@/lib/tmdb/search";
import { toSearchItem } from "@/lib/tmdb/search-items";

// A ROUTE HANDLER: a tiny API endpoint inside our app, at GET /api/search?q=dune
// (a file named route.ts instead of page.tsx returns data, not a page).
//
// Why do we need it? The ⌘K palette runs in the BROWSER, and the browser must
// never see the TMDB token. So the browser asks OUR server, and our server asks
// TMDB with the token. Same "kitchen" idea as before, just for live typing.

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const data = await search(query, "all");

  // Send only the top 8, in the small SearchItem shape the palette needs.
  return Response.json({ results: data.results.slice(0, 8).map(toSearchItem) });
}
