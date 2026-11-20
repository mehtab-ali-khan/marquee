import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { TrailerButton } from "@/components/media/TrailerButton";
import { WatchProviders } from "@/components/media/WatchProviders";
import { TitleLibraryActions } from "@/features/library/TitleLibraryActions";
import { WATCH_REGION, formatRuntime, formatYears, pickTrailer, plural } from "@/lib/tmdb/details";
import { backdropUrl } from "@/lib/tmdb/images";
import type { MovieDetails, MovieSummary, TvDetails, TvSummary } from "@/lib/tmdb/types";

// What's inside the detail modal, for movies AND shows (Server Component).
// The two `...Sheet` functions translate TMDB's movie/TV shapes into one
// common shape, so the layout below is written once.

type Sheet = {
  type: "movie" | "tv";
  id: number;
  title: string;
  tagline: string | null;
  overview: string;
  backdropPath: string | null;
  facts: (string | null | undefined)[];
  rating: number;
  voteCount: number;
  genres: string[];
  cast: string[];
  credit: { label: string; names: string[] };
  trailerKey: string | null;
  region: MovieDetails["watch/providers"]["results"][string] | undefined;
  similar: { key: string; href: string; title: string; year?: string; overview: string; backdropPath: string | null }[];
};

export function movieSheet(movie: MovieDetails): Sheet {
  return {
    type: "movie",
    id: movie.id,
    title: movie.title,
    tagline: movie.tagline,
    overview: movie.overview,
    backdropPath: movie.backdrop_path,
    facts: [movie.release_date?.slice(0, 4), formatRuntime(movie.runtime)],
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    genres: movie.genres.map((g) => g.name),
    cast: movie.credits.cast.slice(0, 5).map((p) => p.name),
    credit: { label: "Director", names: movie.credits.crew.filter((p) => p.job === "Director").map((p) => p.name) },
    trailerKey: pickTrailer(movie.videos.results)?.key ?? null,
    region: movie["watch/providers"].results[WATCH_REGION.code],
    similar: movie.recommendations.results.slice(0, 9).map(similarMovie),
  };
}

export function tvSheet(show: TvDetails): Sheet {
  return {
    type: "tv",
    id: show.id,
    title: show.name,
    tagline: show.tagline,
    overview: show.overview,
    backdropPath: show.backdrop_path,
    facts: [formatYears(show), plural(show.number_of_seasons, "season")],
    rating: show.vote_average,
    voteCount: show.vote_count,
    genres: show.genres.map((g) => g.name),
    cast: show.credits.cast.slice(0, 5).map((p) => p.name),
    credit: { label: "Created by", names: show.created_by.map((c) => c.name) },
    trailerKey: pickTrailer(show.videos.results)?.key ?? null,
    region: show["watch/providers"].results[WATCH_REGION.code],
    similar: show.recommendations.results.slice(0, 9).map(similarShow),
  };
}

function similarMovie(m: MovieSummary) {
  return { key: `movie-${m.id}`, href: `/movie/${m.id}`, title: m.title, year: m.release_date?.slice(0, 4), overview: m.overview, backdropPath: m.backdrop_path };
}
function similarShow(s: TvSummary) {
  return { key: `tv-${s.id}`, href: `/tv/${s.id}`, title: s.name, year: s.first_air_date?.slice(0, 4), overview: s.overview, backdropPath: s.backdrop_path };
}

export function TitleSheet({ sheet, children }: { sheet: Sheet; children?: React.ReactNode }) {
  const backdrop = backdropUrl(sheet.backdropPath, "w1280");
  const facts = sheet.facts.filter(Boolean);

  return (
    <article>
      {/* 1. Big image header with title + actions */}
      <header className="relative aspect-video max-h-[60vh] w-full overflow-hidden bg-raised">
        {backdrop && (
          <Image src={backdrop} alt="" fill sizes="(min-width: 960px) 920px, 100vw" loading="eager" fetchPriority="high" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-10 sm:pb-8">
          <h2 className="max-w-2xl text-3xl leading-[1.05] sm:text-5xl [text-shadow:0_2px_24px_rgb(0_0_0/0.5)]">{sheet.title}</h2>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {sheet.trailerKey && <TrailerButton youtubeKey={sheet.trailerKey} title={sheet.title} />}
            {/* Personal (reads the session) → streams in on its own. */}
            <Suspense fallback={<span className="h-11 w-56 rounded-md bg-canvas/40" aria-hidden="true" />}>
              <TitleLibraryActions type={sheet.type} id={sheet.id} />
            </Suspense>
          </div>
        </div>
      </header>

      <div className="space-y-10 px-5 pt-2 pb-10 sm:px-10">
        {/* 2. Two columns: story on the left, facts on the right */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-10">
          <div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted tabular-nums">
              {sheet.rating > 0 && (
                <span className="flex items-center gap-1 font-medium text-fg">
                  <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                  {sheet.rating.toFixed(1)}
                  <span className="font-normal text-fg-subtle">({sheet.voteCount.toLocaleString("en-US")})</span>
                </span>
              )}
              {facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </p>
            {sheet.tagline && <p className="mt-4 font-display text-lg text-fg italic">{sheet.tagline}</p>}
            <p className="mt-3 leading-relaxed text-fg-muted">{sheet.overview || "No overview available yet."}</p>
          </div>

          <dl className="space-y-3 text-sm">
            <Fact label="Cast" value={sheet.cast.join(", ")} />
            <Fact label="Genres" value={sheet.genres.join(", ")} />
            <Fact label={sheet.credit.label} value={sheet.credit.names.join(", ")} />
          </dl>
        </section>

        {/* Extra sections (e.g. the episode list for shows) */}
        {children}

        {/* 3. Where to watch */}
        <WatchProviders region={sheet.region} countryName={WATCH_REGION.name} />

        {/* 4. More like this. These links are intercepted too, so the modal
               simply switches to the other title. */}
        {sheet.similar.length > 0 && (
          <section>
            <h3 className="mb-4 text-xl">More like this</h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sheet.similar.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} scroll={false} className="group block overflow-hidden rounded-md bg-raised">
                    <div className="relative aspect-video bg-canvas">
                      {item.backdropPath && (
                        <Image
                          src={backdropUrl(item.backdropPath, "w300")!}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 290px, 45vw"
                          className="object-cover transition-transform duration-300 ease-out-soft group-hover:scale-[1.04]"
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-medium text-fg">{item.title}</p>
                      <p className="mt-0.5 text-xs text-fg-subtle tabular-nums">{item.year}</p>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-fg-muted">{item.overview}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 5. Full page: a plain <a> = full page load, so it ISN'T intercepted. */}
        <a
          href={`/${sheet.type}/${sheet.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
        >
          Open full page with cast and recommendations <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="inline text-fg-subtle">{label}: </dt>
      <dd className="inline text-fg-muted">{value}</dd>
    </div>
  );
}

/** Same layout, grey blocks: shown instantly while a title loads. */
export function TitleSheetSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-video max-h-[60vh] w-full animate-pulse bg-raised" />
      <div className="space-y-3 px-5 py-8 sm:px-10">
        <div className="h-4 w-48 rounded-sm bg-raised" />
        <div className="h-4 w-full rounded-sm bg-raised" />
        <div className="h-4 w-11/12 rounded-sm bg-raised" />
        <div className="h-4 w-2/3 rounded-sm bg-raised" />
      </div>
    </div>
  );
}
