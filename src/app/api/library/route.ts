import type { NextRequest } from "next/server";
import { readLibrarySelection } from "@/features/library/selection";
import { getCurrentUser, getSessionId } from "@/lib/auth/session";
import { getLibraryPage } from "@/lib/tmdb/library";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  try {
    const [user, sessionId] = await Promise.all([getCurrentUser(), getSessionId()]);
    if (!user || !sessionId) return Response.json({}, { status: 401, headers });

    const params = request.nextUrl.searchParams;
    const selection = readLibrarySelection({
      tab: params.get("tab"),
      type: params.get("type"),
      page: params.get("page"),
    });
    const results = await getLibraryPage(
      { accountId: user.id, sessionId },
      selection.tab,
      selection.type,
      selection.page,
    );
    return Response.json(results, { headers });
  } catch {
    return Response.json({}, { status: 502, headers });
  }
}
