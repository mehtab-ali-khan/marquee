import { Suspense } from "react";
import { TitleLibraryActions } from "@/features/library/TitleLibraryActions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailHeader } from "@/components/media/DetailHeader";
import { MediaRail } from "@/components/media/MediaRail";
import { PersonCard } from "@/components/media/PersonCard";
import { SeasonCard } from "@/components/media/SeasonCard";
import { TvCard } from "@/components/media/TitleCards";
import { TrailerButton } from "@/components/media/TrailerButton";
import { WatchProviders } from "@/components/media/WatchProviders";
import { Container } from "@/components/ui/Container";
import { WATCH_REGION, pickTrailer } from "@/lib/tmdb/details";
import { backdropUrl } from "@/lib/tmdb/images";
import { getTvShow } from "@/lib/tmdb/tv";
import type { TvDetails } from "@/lib/tmdb/types";

// /tv/1396 → Breaking Bad. Same structure as the movie page; the shared
// pieces (header, cast rail, trailer, where to watch) are reused components.

/** Load the show, or show the 404 page if it doesn't exist. */
async function loadShow(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const show = await getTvShow(id);
  if (!show) notFound();
  return show;
}

export async function generateMetadata({ params }: PageProps<"/tv/[id]">): Promise<Metadata> {
  const { id } = await params;
  const show = await loadShow(id);
  const image = backdropUrl(show.backdrop_path, "w1280");

  return {
    title: show.name,
    description: show.overview,
    openGraph: { title: show.name, description: show.overview, images: image ? [image] : [] },
  };
}

/**
 * The years a show ran:
 *   ended:   "2008–2013"   (or just "2008" if it lasted one year)
 *   running: "2019–present"
 */
function formatYears(show: TvDetails) {
  const start = show.first_air_date?.slice(0, 4);
  if (!start) return null;
  const isOver = show.status === "Ended" || show.status === "Canceled";
  if (!isOver) return `${start}–present`;
  const end = show.last_air_date?.slice(0, 4);
  return end && end !== start ? `${start}–${end}` : start;
}

/** 1 → "1 season", 5 → "5 seasons" */
function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export default async function TvPage({ params }: PageProps<"/tv/[id]">) {
  const { id } = await params;
  const show = await loadShow(id);

  const cast = show.credits.cast.slice(0, 20);
  const trailer = pickTrailer(show.videos.results);
  const recommendations = show.recommendations.results;
  // Season 0 is "Specials" (extras), not a real season, so we leave it out.
  const seasons = show.seasons.filter((season) => season.season_number > 0);

  return (
    <main className="pb-16">
      <DetailHeader
        title={show.name}
        tagline={show.tagline}
        backdropPath={show.backdrop_path}
        posterPath={show.poster_path}
        facts={[
          formatYears(show),
          plural(show.number_of_seasons, "season"),
          plural(show.number_of_episodes, "episode"),
        ]}
        rating={{ average: show.vote_average, count: show.vote_count }}
        genres={show.genres}
        credit={{ label: "Created by", names: show.created_by.map((c) => c.name) }}
      >
        {trailer && <TrailerButton youtubeKey={trailer.key} title={show.name} />}
        <Suspense fallback={<span aria-hidden="true" className="block h-11 w-40 rounded-md bg-canvas/40" />}>
          <TitleLibraryActions type="tv" id={show.id} />
        </Suspense>
      </DetailHeader>

      <Container>
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
          <section>
            <h2 className="mb-3 text-xl">Overview</h2>
            <p className="max-w-3xl leading-relaxed text-fg-muted">{show.overview || "No overview available yet."}</p>
            {show.networks.length > 0 && (
              <p className="mt-4 text-sm text-fg-muted">
                On <span className="text-fg">{show.networks.map((n) => n.name).join(", ")}</span>
                {" · "}
                {show.status}
              </p>
            )}
          </section>
          <WatchProviders
            region={show["watch/providers"].results[WATCH_REGION.code]}
            countryName={WATCH_REGION.name}
          />
        </div>
      </Container>

      {/* The one TV-only section. */}
      {seasons.length > 0 && (
        <div className="mt-8">
          <MediaRail title="Seasons">
            {seasons.map((season) => (
              <SeasonCard
                key={season.id}
                name={season.name}
                posterPath={season.poster_path}
                episodeCount={season.episode_count}
                airDate={season.air_date}
              />
            ))}
          </MediaRail>
        </div>
      )}

      {cast.length > 0 && (
        <MediaRail title="Cast">
          {cast.map((person) => (
            <PersonCard
              key={person.id}
              id={person.id}
              name={person.name}
              role={person.character}
              profilePath={person.profile_path}
            />
          ))}
        </MediaRail>
      )}

      {recommendations.length > 0 && (
        <MediaRail title="More like this">
          {recommendations.map((rec) => (
            <TvCard key={rec.id} show={rec} />
          ))}
        </MediaRail>
      )}
    </main>
  );
}
