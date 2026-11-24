// Turns a person's raw TMDB credits into what the person page shows:
//  - "Known for": their most popular titles
//  - a filmography: one line per title (duplicates merged), newest first, grouped by year
// Pure functions (data in → data out, no fetching), so they're easy to read and test.

import type { PersonCastCredit, PersonCrewCredit } from "./types";

type AnyCredit = PersonCastCredit | PersonCrewCredit;

/** One line in the filmography. */
export type FilmographyEntry = {
  key: string; // "movie-550", unique per title
  mediaType: "movie" | "tv";
  id: number;
  title: string;
  date: string; // "1999-10-15", or "" if unknown/unreleased
  roles: string[]; // characters ("Walter White") or jobs ("Director", "Producer")
  episodeCount?: number; // TV acting only
};

export type FilmographyYear = {
  label: string; // "2024" or "Upcoming"
  entries: FilmographyEntry[];
};

// Talk shows and news appear in many filmographies ("Himself" on a late-night
// show) and drown out real work, so we leave them out of "Known for".
const TALK_SHOW = 10767;
const NEWS = 10763;

/** Title and date live in different fields for movies and TV. */
function titleOf(credit: AnyCredit) {
  return credit.media_type === "movie" ? credit.title : credit.name;
}
function dateOf(credit: AnyCredit) {
  return (credit.media_type === "movie" ? credit.release_date : credit.first_air_date) ?? "";
}
function roleOf(credit: AnyCredit) {
  return "character" in credit ? credit.character : credit.job;
}

/**
 * The person's most recognisable titles: one per title, without talk shows,
 * ranked by vote_count (how many people rated it, a good "how well known" signal).
 */
export function knownFor(credits: AnyCredit[], limit = 12) {
  const unique = new Map<string, AnyCredit>();
  for (const credit of credits) {
    if (credit.genre_ids.includes(TALK_SHOW) || credit.genre_ids.includes(NEWS)) continue;
    unique.set(`${credit.media_type}-${credit.id}`, credit); // same key = same title, kept once
  }
  return [...unique.values()].sort((a, b) => b.vote_count - a.vote_count).slice(0, limit);
}

/**
 * One entry per title. If someone has several roles in the same title
 * (two characters, or "Director" + "Writer"), they're merged into one line.
 * Newest first; titles without a date (not released yet) come first.
 */
export function buildFilmography(credits: AnyCredit[]): FilmographyEntry[] {
  const byTitle = new Map<string, FilmographyEntry>();

  for (const credit of credits) {
    const key = `${credit.media_type}-${credit.id}`;
    const role = roleOf(credit);
    const existing = byTitle.get(key);

    if (existing) {
      // Seen this title already: just add the extra role (if it's new and not empty).
      if (role && !existing.roles.includes(role)) existing.roles.push(role);
      continue;
    }

    byTitle.set(key, {
      key,
      mediaType: credit.media_type,
      id: credit.id,
      title: titleOf(credit),
      date: dateOf(credit),
      roles: role ? [role] : [],
      episodeCount: "episode_count" in credit ? credit.episode_count : undefined,
    });
  }

  return [...byTitle.values()].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return -1; // undated (upcoming) first
    if (!b.date) return 1;
    return b.date.localeCompare(a.date); // "2024-..." before "1999-..."
  });
}

/** Groups sorted entries into years: [{ label: "2024", entries }, ...]. */
export function groupByYear(entries: FilmographyEntry[]): FilmographyYear[] {
  const groups: FilmographyYear[] = [];
  for (const entry of entries) {
    const label = entry.date ? entry.date.slice(0, 4) : "Upcoming";
    const last = groups.at(-1);
    if (last?.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }
  return groups;
}
