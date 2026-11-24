import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { setSessionCookie, takeReturnTo } from "@/lib/auth/session";
import { createSession } from "@/lib/tmdb/auth";

// GET /auth/callback?request_token=abc&approved=true
// TMDB sends the user here after they click "Approve" (or "Deny") on themoviedb.org.
// This is a Route Handler (not a page) because it must SET A COOKIE and then
// redirect: it never shows any UI of its own.

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const requestToken = params.get("request_token");

  // The user clicked "Deny", or someone opened this URL by hand.
  if (!requestToken || params.get("approved") !== "true") {
    redirect("/login?error=denied");
  }

  // Step 3: approved token → session id. Fails if the token is fake,
  // expired (older than ~60 min) or was already used.
  let sessionId: string;
  try {
    sessionId = await createSession(requestToken);
  } catch (error) {
    // Logged on the server (your terminal / hosting logs), never shown to the user.
    console.error("[auth] Could not create TMDB session:", error);
    redirect("/login?error=failed");
  }

  await setSessionCookie(sessionId);
  redirect(await takeReturnTo());
}
