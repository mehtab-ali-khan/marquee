import type { NextRequest } from "next/server";
import { discover } from "@/lib/tmdb/discover";
import { parseDiscoverParams } from "@/lib/tmdb/discover-params";

// GET /api/discover?type=tv&genre=18&page=3
// The infinite-scroll grid calls this from the browser to load the NEXT page.
// (Page 1 is rendered on the server by the /discover page itself.)

export async function GET(request: NextRequest) {
  const { page, ...filters } = parseDiscoverParams(request.nextUrl.searchParams);
  return Response.json(await discover(filters, page));
}
