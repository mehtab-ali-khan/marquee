import "server-only";
import { cacheLife } from "next/cache";
import { TmdbError, tmdbFetch } from "./client";
import type { PersonDetails } from "./types";

/**
 * A person's details + full filmography (movies and TV together), or null
 * if TMDB has no such person. Same pattern as getMovie / getTvShow.
 * Biographies and filmographies change rarely, so we reuse them for a day.
 */
export async function getPerson(id: number): Promise<PersonDetails | null> {
  "use cache";
  cacheLife("days");
  try {
    return await tmdbFetch<PersonDetails>(`/person/${id}`, { append_to_response: "combined_credits" });
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}
