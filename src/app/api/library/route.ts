import type { NextRequest } from "next/server";
import { readMediaType, readPage, readShelf } from "@/features/library/selection";
import { getCurrentUser, getSessionId } from "@/lib/auth/session";
import { getLibraryPage } from "@/lib/tmdb/library";

// GET /api/library?tab=favorite&type=tv&page=2
// The library's "Show more" button calls this for page 2, 3, …
// (Page 1 of every shelf is already rendered by the /library page itself.)

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  try {
    const [user, sessionId] = await Promise.all([getCurrentUser(), getSessionId()]);
    if (!user || !sessionId) return Response.json({}, { status: 401, headers });

    const params = request.nextUrl.searchParams;
    const page = await getLibraryPage(
      { accountId: user.id, sessionId },
      readShelf(params.get("tab")),
      readMediaType(params.get("type")),
      readPage(params.get("page")),
    );
    return Response.json(page, { headers });
  } catch {
    return Response.json({}, { status: 502, headers });
  }
}
