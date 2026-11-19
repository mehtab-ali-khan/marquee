import Image from "next/image";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { cn } from "@/lib/utils";
import type { Genre } from "@/lib/tmdb/types";

// The top of every detail page (movie AND TV): backdrop, poster, title,
// tagline, meta line, rating, genres, credit line and action buttons.
// Moved out of the movie page so the TV page can reuse it unchanged.

type DetailHeaderProps = {
  title: string;
  tagline?: string | null;
  backdropPath: string | null;
  posterPath: string | null;
  /** Short facts shown with dots between them, e.g. ["1999", "2h 19m"]. Empty values are skipped. */
  facts: (string | null | undefined)[];
  rating?: { average: number; count: number };
  genres: Genre[];
  /** e.g. { label: "Directed by", names: ["David Fincher"] } */
  credit?: { label: string; names: string[] };
  /** Buttons under the info (trailer, watchlist...). */
  children?: React.ReactNode;
};

export function DetailHeader({
  title,
  tagline,
  backdropPath,
  posterPath,
  facts,
  rating,
  genres,
  credit,
  children,
}: DetailHeaderProps) {
  const backdrop = backdropUrl(backdropPath, "w1280");
  const poster = posterUrl(posterPath, "w500");
  const visibleFacts = facts.filter(Boolean); // drop null/undefined/""

  return (
    <section aria-labelledby="title-heading" className="relative isolate overflow-hidden border-b border-line bg-surface">
      {backdrop && (
        <div className="absolute inset-x-0 top-0 -z-10 h-60 md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[70%]">
          <Image
            src={backdrop}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 70vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover object-[center_32%]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/45 to-surface/10 md:bg-linear-to-r md:from-surface md:via-surface/80 md:to-surface/15" />
        </div>
      )}
      <Container className={cn("pb-8 md:py-12 lg:py-16", backdrop ? "pt-32" : "pt-8")}>
        <div className="flex items-end gap-5 md:items-center md:gap-8 lg:gap-10">
          {poster && (
            <div className="relative hidden aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-raised shadow-xl md:block lg:w-48">
              <Image src={poster} alt="" fill sizes="(min-width: 1024px) 192px, 160px" className="object-cover" />
            </div>
          )}

          <div className="min-w-0 max-w-2xl">
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted tabular-nums">
              {visibleFacts.map((fact, index) => (
                <span key={fact} className="inline-flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">·</span>}
                  {fact}
                </span>
              ))}
              {rating && rating.average > 0 && (
                <span
                  className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 font-semibold text-fg"
                  aria-label={`TMDB rating ${rating.average.toFixed(1)} out of 10, ${rating.count.toLocaleString("en-US")} votes`}
                >
                  <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                  {rating.average.toFixed(1)}
                </span>
              )}
            </div>
            <h1 id="title-heading" className="text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
            {tagline && <p className="mt-2 text-base text-fg-muted sm:text-lg">{tagline}</p>}

            {genres.length > 0 && (
              <ul aria-label="Genres" className="mt-4 flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <li key={genre.id} className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs text-fg">
                    {genre.name}
                  </li>
                ))}
              </ul>
            )}

            {credit && credit.names.length > 0 && (
              <p className="mt-4 text-sm text-fg-muted">
                {credit.label} <span className="font-medium text-fg">{credit.names.join(", ")}</span>
              </p>
            )}

            {children && <div className="mt-6 flex flex-wrap items-start gap-2">{children}</div>}
          </div>
        </div>
      </Container>
    </section>
  );
}
