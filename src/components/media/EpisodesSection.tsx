import { toEpisodeItems } from "@/lib/tmdb/episodes";
import { getSeason } from "@/lib/tmdb/tv";
import type { TvDetails } from "@/lib/tmdb/types";
import { EpisodeList } from "./EpisodeList";

// Server part of the episode list: decides which season to open on and
// fetches it, so the first list arrives WITH the page (no client fetch).
// Used by the TV detail modal and the full TV page (wrap it in <Suspense>).

export async function EpisodesSection({ show }: { show: TvDetails }) {
  // Season 0 = "Specials" (extras): hide it unless it's all there is.
  const regular = show.seasons.filter((s) => s.season_number > 0);
  const seasons = (regular.length > 0 ? regular : show.seasons).map((s) => ({
    number: s.season_number,
    name: s.name,
    episodeCount: s.episode_count,
  }));
  if (seasons.length === 0) return null;

  // Like Netflix: open on the season with the most recent episode, not season 1.
  const latest = show.last_episode_to_air?.season_number;
  const initialSeason = seasons.some((s) => s.number === latest) ? latest! : seasons[0].number;

  const season = await getSeason(show.id, initialSeason).catch(() => null);

  return (
    <EpisodeList
      key={show.id}
      showId={show.id}
      seasons={seasons}
      initialSeason={initialSeason}
      initialEpisodes={season ? toEpisodeItems(season) : []}
    />
  );
}

export function EpisodesSectionSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-24 rounded-sm bg-raised" />
        <div className="h-10 w-32 rounded-md bg-raised" />
      </div>
      <div className="space-y-3 border-t border-line pt-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-md bg-raised" />
        ))}
      </div>
    </div>
  );
}
