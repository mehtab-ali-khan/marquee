// Turns a TMDB movie or show into one "program" shape for the detail page,
// so the Festival Program layout is written once for both.
// Pure functions (no fetching, no React).

import { movieToCard, tvToCard, type CardData } from "@/lib/tmdb/cards";
import { WATCH_REGION, formatRuntime, formatYears, pickTrailer, plural } from "@/lib/tmdb/details";
import type { MovieDetails, TvDetails, WatchProviderRegion } from "@/lib/tmdb/types";

export type Person = { id: number; name: string };

export type Program = {
  type: "movie" | "tv";
  id: number;
  title: string;
  eyebrow: string[]; // ["Now showing", "Film", "2026"]
  tagline: string | null;
  overview: string;
  backdropPath: string | null;
  genres: string[];
  rating: number;
  voteCount: number;
  /** The four facts on the ticket stub. */
  stub: { label: string; value: string }[];
  trailerKey: string | null;
  /** The poster-style billing block under the title: "Directed by …", "Starring …". */
  billing: { label: string; names: string[] }[];
  cast: (Person & { character: string; profilePath: string | null })[];
  crew: { role: string; people: Person[] }[]; // "Directed by", "Music by"...
  specs: { label: string; value: string }[];
  region: WatchProviderRegion | undefined;
  related: CardData[];
};

const DATE = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
const LANGUAGE = new Intl.DisplayNames(["en"], { type: "language" });

function formatDate(date: string | null | undefined) {
  return date ? DATE.format(new Date(date)) : null;
}
function languageName(code: string) {
  try {
    return LANGUAGE.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Drop empty values so the page never shows "Budget: —". */
function present(rows: { label: string; value: string | null | undefined }[]) {
  return rows.filter((row): row is { label: string; value: string } => Boolean(row.value));
}

/** Group crew members by the jobs we want to credit, in this order. */
function creditCrew(crew: MovieDetails["credits"]["crew"], roles: [job: string, label: string][]) {
  return roles
    .map(([job, role]) => {
      const seen = new Set<number>();
      const people = crew.filter((c) => c.job === job && !seen.has(c.id) && seen.add(c.id)).map(({ id, name }) => ({ id, name }));
      return { role, people };
    })
    .filter((group) => group.people.length > 0);
}

export function movieProgram(movie: MovieDetails): Program {
  const year = movie.release_date?.slice(0, 4);
  const us = movie.release_dates.results.find((r) => r.iso_3166_1 === "US");
  // Prefer the theatrical (type 3) certificate, otherwise any non-empty one.
  const certificate =
    us?.release_dates.find((d) => d.type === 3 && d.certification)?.certification ??
    us?.release_dates.find((d) => d.certification)?.certification ??
    null;
  const released = movie.status === "Released";

  return {
    type: "movie",
    id: movie.id,
    title: movie.title,
    eyebrow: [released ? "Now showing" : "Coming soon", "Film", year].filter(Boolean) as string[],
    tagline: movie.tagline,
    overview: movie.overview,
    backdropPath: movie.backdrop_path,
    genres: movie.genres.map((g) => g.name),
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    stub: present([
      { label: "Runtime", value: formatRuntime(movie.runtime) },
      { label: "Rated", value: certificate },
      { label: "Released", value: year },
      { label: "Language", value: languageName(movie.original_language) },
    ]),
    trailerKey: pickTrailer(movie.videos.results)?.key ?? null,
    billing: [
      { label: "Directed by", names: movie.credits.crew.filter((c) => c.job === "Director").map((c) => c.name) },
      { label: "Starring", names: movie.credits.cast.slice(0, 4).map((c) => c.name) },
    ].filter((line) => line.names.length > 0),
    cast: movie.credits.cast.slice(0, 12).map(({ id, name, character, profile_path }) => ({ id, name, character, profilePath: profile_path })),
    crew: creditCrew(movie.credits.crew, [
      ["Director", "Directed by"],
      ["Screenplay", "Screenplay by"],
      ["Writer", "Written by"],
      ["Novel", "Based on the novel by"],
      ["Original Music Composer", "Music by"],
      ["Director of Photography", "Cinematography by"],
      ["Editor", "Edited by"],
    ]),
    specs: present([
      { label: "Release date", value: formatDate(movie.release_date) },
      { label: "Status", value: movie.status },
      { label: "Original language", value: languageName(movie.original_language) },
      { label: "Budget", value: movie.budget > 0 ? MONEY.format(movie.budget) : null },
      { label: "Box office", value: movie.revenue > 0 ? MONEY.format(movie.revenue) : null },
      { label: "Studios", value: movie.production_companies.slice(0, 3).map((c) => c.name).join(", ") },
    ]),
    region: movie["watch/providers"].results[WATCH_REGION.code],
    related: movie.recommendations.results.slice(0, 12).map(movieToCard),
  };
}

export function tvProgram(show: TvDetails): Program {
  const rating = show.content_ratings.results.find((r) => r.iso_3166_1 === "US")?.rating || null;
  const running = show.status !== "Ended" && show.status !== "Canceled";

  return {
    type: "tv",
    id: show.id,
    title: show.name,
    eyebrow: [running ? "Now airing" : "Series", formatYears(show)].filter(Boolean) as string[],
    tagline: show.tagline,
    overview: show.overview,
    backdropPath: show.backdrop_path,
    genres: show.genres.map((g) => g.name),
    rating: show.vote_average,
    voteCount: show.vote_count,
    stub: present([
      { label: "Seasons", value: plural(show.number_of_seasons, "season") },
      { label: "Rated", value: rating },
      { label: "Episodes", value: String(show.number_of_episodes) },
      { label: "Network", value: show.networks[0]?.name },
    ]),
    trailerKey: pickTrailer(show.videos.results)?.key ?? null,
    billing: [
      { label: "Created by", names: show.created_by.map((c) => c.name) },
      { label: "Starring", names: show.credits.cast.slice(0, 4).map((c) => c.name) },
    ].filter((line) => line.names.length > 0),
    cast: show.credits.cast.slice(0, 12).map(({ id, name, character, profile_path }) => ({ id, name, character, profilePath: profile_path })),
    crew: [
      ...(show.created_by.length ? [{ role: "Created by", people: show.created_by.map(({ id, name }) => ({ id, name })) }] : []),
      ...creditCrew(show.credits.crew, [
        ["Executive Producer", "Executive producers"],
        ["Original Music Composer", "Music by"],
      ]).map((group) => ({ ...group, people: group.people.slice(0, 4) })),
    ],
    specs: present([
      { label: "First aired", value: formatDate(show.first_air_date) },
      { label: "Last aired", value: running ? null : formatDate(show.last_air_date) },
      { label: "Status", value: show.status },
      { label: "Original language", value: languageName(show.original_language) },
      { label: "Networks", value: show.networks.map((n) => n.name).join(", ") },
      { label: "Episodes", value: `${show.number_of_episodes} across ${plural(show.number_of_seasons, "season")}` },
    ]),
    region: show["watch/providers"].results[WATCH_REGION.code],
    related: show.recommendations.results.slice(0, 12).map(tvToCard),
  };
}
