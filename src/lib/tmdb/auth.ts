import "server-only";
import { tmdbFetch } from "./client";

// The TMDB calls behind "Sign in with TMDB". NOTHING here is cached:
// these are per-user, one-time actions, and personal data must never land
// in a shared cache where another visitor could receive it.
//
// The flow (TMDB's official v3 user authentication):
//   1. createRequestToken()   → a one-time token
//   2. user approves it on themoviedb.org (we redirect them there)
//   3. createSession(token)   → a session_id: the key to their account
//   4. getAccount(sessionId)  → who they are (id, username, avatar)
//   5. deleteSession()        → logout: TMDB invalidates the session

/** Step 1: a short-lived token (valid ~60 minutes) for the user to approve. */
export async function createRequestToken() {
  const data = await tmdbFetch<{ success: boolean; request_token: string }>("/authentication/token/new");
  return data.request_token;
}

/** Step 3: exchange the APPROVED token for a long-lived session id. */
export async function createSession(requestToken: string) {
  const data = await tmdbFetch<{ success: boolean; session_id: string }>(
    "/authentication/session/new",
    {},
    { method: "POST", body: { request_token: requestToken } },
  );
  return data.session_id;
}

/** Step 5: logout. TMDB forgets the session, so the id is useless even if leaked. */
export async function deleteSession(sessionId: string) {
  await tmdbFetch("/authentication/session", {}, { method: "DELETE", body: { session_id: sessionId } });
}

export type TmdbAccount = {
  id: number;
  username: string;
  name: string;
  avatar: {
    tmdb: { avatar_path: string | null };
    gravatar: { hash: string | null };
  };
};

/** Step 4: the account behind a session. Throws TmdbError 401 if the session is invalid. */
export async function getAccount(sessionId: string) {
  return tmdbFetch<TmdbAccount>("/account", { session_id: sessionId });
}
