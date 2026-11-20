// Small helpers shared by the movie and TV detail pages.
// (Moved out of the movie page once the TV page needed them too.)
// No "server-only": plain functions and constants, no secrets.

import type { TvDetails, Video } from "./types";

/** 139 → "2h 19m" */
export function formatRuntime(minutes: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** 1 → "1 season", 5 → "5 seasons" */
export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** The years a show ran: "2008–2013", "2008" (one year) or "2019–present". */
export function formatYears(show: Pick<TvDetails, "first_air_date" | "last_air_date" | "status">) {
  const start = show.first_air_date?.slice(0, 4);
  if (!start) return null;
  const isOver = show.status === "Ended" || show.status === "Canceled";
  if (!isOver) return `${start}–present`;
  const end = show.last_air_date?.slice(0, 4);
  return end && end !== start ? `${start}–${end}` : start;
}

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
