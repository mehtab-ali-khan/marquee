import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getAccount } from "@/lib/tmdb/auth";
import { TmdbError } from "@/lib/tmdb/client";

// Everything about "who is logged in" lives here (a "Data Access Layer").
// Pages and components never touch the cookie directly; they ask these functions.

const SESSION_COOKIE = "marquee_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Store the TMDB session id in a cookie the browser keeps but JavaScript
 * can NEVER read. Only callable from a Server Action or Route Handler
 * (setting a cookie means adding a Set-Cookie header to the response).
 */
export async function setSessionCookie(sessionId: string) {
  (await cookies()).set(SESSION_COOKIE, sessionId, {
    httpOnly: true, // document.cookie can't see it → an XSS bug can't steal it
    secure: process.env.NODE_ENV === "production", // HTTPS only in production (localhost is http)
    sameSite: "lax", // not sent on cross-site POSTs → blocks CSRF tricks
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

// --- Where to send the user after login -----------------------------------

const RETURN_TO_COOKIE = "marquee_return_to";

/**
 * Only allow returning to a path on OUR site. Without this check, a link like
 * /login?next=https://evil.example would send people to another site after
 * logging in (an "open redirect", a classic phishing trick).
 */
export function safeReturnPath(value: unknown) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/library";
}

/** Remember the page to return to during the trip to TMDB (5 minutes is plenty). */
export async function setReturnTo(path: string) {
  (await cookies()).set(RETURN_TO_COOKIE, safeReturnPath(path), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 5,
  });
}

/** Read and forget the remembered page (used once, by the callback route). */
export async function takeReturnTo() {
  const store = await cookies();
  const path = safeReturnPath(store.get(RETURN_TO_COOKIE)?.value);
  store.delete(RETURN_TO_COOKIE);
  return path;
}

/** The raw session id, or null when logged out. Server-only, never sent to the browser. */
export async function getSessionId() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export type CurrentUser = {
  id: number;
  username: string;
  name: string;
  avatarPath: string | null; // TMDB avatar (an image path)
  gravatarHash: string | null; // fallback avatar from gravatar.com
};

/**
 * The logged-in user, or null.
 *
 * React's cache(): if the header AND the page both ask for the user during
 * ONE request, TMDB is only called once. (It does NOT share anything between
 * requests or users, unlike "use cache", which would be dangerous here.)
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const sessionId = await getSessionId();
  if (!sessionId) return null;

  try {
    const account = await getAccount(sessionId);
    return {
      id: account.id,
      username: account.username,
      name: account.name,
      avatarPath: account.avatar.tmdb.avatar_path,
      gravatarHash: account.avatar.gravatar.hash,
    };
  } catch (error) {
    // Session expired or was revoked on TMDB's side → treat as logged out.
    // (We can't delete the cookie here: rendering can't set cookies.)
    if (error instanceof TmdbError && error.status === 401) return null;
    throw error;
  }
});
