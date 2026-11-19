"use server";
// ↑ "use server" makes every EXPORTED function a SERVER ACTION: a function
// that runs on the server but can be called from the browser, e.g. by a
// <form action={signIn}>. Next creates the network request for us
// (no fetch, no API route to write), and it checks the request comes from
// our own site (built-in CSRF protection).
//
// Important: each export here is effectively a public endpoint, so this file
// exports ONLY the two actions. Helpers live in lib/auth/session.ts.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearSessionCookie, getSessionId, setReturnTo } from "@/lib/auth/session";
import { createRequestToken, deleteSession } from "@/lib/tmdb/auth";

/** Our own address (http://localhost:3000 locally, https://... in production). */
async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * Login, steps 1 + 2: get a request token from TMDB, then send the user to
 * themoviedb.org to approve it. TMDB sends them back to /auth/callback.
 */
export async function signIn(formData: FormData) {
  await setReturnTo(String(formData.get("next") ?? ""));

  let requestToken: string;
  try {
    requestToken = await createRequestToken();
  } catch {
    redirect("/login?error=unavailable");
  }

  const callback = `${await getOrigin()}/auth/callback`;
  // redirect() must be OUTSIDE try/catch: it works by throwing a special error.
  redirect(`https://www.themoviedb.org/authenticate/${requestToken}?redirect_to=${encodeURIComponent(callback)}`);
}

/** Logout: invalidate the session at TMDB, delete our cookie, go home. */
export async function signOut() {
  const sessionId = await getSessionId();
  if (sessionId) {
    // If TMDB is unreachable we still log out locally; nothing to show the user.
    await deleteSession(sessionId).catch(() => {});
  }
  await clearSessionCookie();
  redirect("/");
}
