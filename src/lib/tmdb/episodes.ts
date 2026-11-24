// The small episode shape the episode list needs (server AND browser use it).
// No "server-only": pure function + type.

import { formatRuntime } from "./details";
import type { SeasonDetails } from "./types";

export type EpisodeItem = {
  id: number;
  number: number;
  title: string;
  overview: string;
  runtime: string | null; // "48m"
  stillPath: string | null;
};

export function toEpisodeItems(season: SeasonDetails): EpisodeItem[] {
  return season.episodes.map((episode) => ({
    id: episode.id,
    number: episode.episode_number,
    title: episode.name,
    overview: episode.overview,
    runtime: formatRuntime(episode.runtime),
    stillPath: episode.still_path,
  }));
}
