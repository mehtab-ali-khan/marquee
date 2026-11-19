// Small helpers shared by the movie and TV detail pages.
// (Moved out of the movie page once the TV page needed them too.)
// No "server-only": plain functions and constants, no secrets.

import type { Video } from "./types";

/**
 * Which country's streaming services to show. Fixed for now; it could
 * later come from a user setting or the visitor's location.
 */
export const WATCH_REGION = { code: "US", name: "the United States" };

/**
 * Pick the best video to show: an official YouTube trailer if there is one,
 * otherwise any YouTube trailer, otherwise a teaser. null = nothing to show.
 */
export function pickTrailer(videos: Video[]) {
  const youtube = videos.filter((v) => v.site === "YouTube");
  return (
    youtube.find((v) => v.type === "Trailer" && v.official) ??
    youtube.find((v) => v.type === "Trailer") ??
    youtube.find((v) => v.type === "Teaser") ??
    null
  );
}
