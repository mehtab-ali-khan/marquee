import Image from "next/image";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
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
    <>
      {/* Backdrop band at the top, fading into the page. */}
      <div className="relative h-[42vh] min-h-72 overflow-hidden md:h-[55vh]">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-canvas/10" />
      </div>

      {/* Poster + info. The negative margin pulls it up over the backdrop. */}
      <Container className="relative -mt-40 md:-mt-56">
        <div className="flex flex-col gap-8 md:flex-row md:items-end">
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-md border border-line bg-surface shadow-2xl shadow-black/50 md:w-64">
            {poster && (
              <Image
                src={poster}
                alt={`Poster for ${title}`}
                fill
                sizes="(max-width: 768px) 160px, 256px"
                className="object-cover"
              />
            )}
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl">{title}</h1>
            {tagline && <p className="mt-3 font-display text-lg text-fg-muted italic">{tagline}</p>}

            {/* Meta line: facts and rating, separated by dots. */}
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted tabular-nums">
              {visibleFacts.map((fact, i) => (
                <span key={fact} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {fact}
                </span>
              ))}
              {rating && rating.average > 0 && (
                <span className="flex items-center gap-3">
                  {visibleFacts.length > 0 && <span aria-hidden="true">·</span>}
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                    {rating.average.toFixed(1)}
                    <span className="text-fg-subtle">({rating.count.toLocaleString("en-US")} votes)</span>
                  </span>
                </span>
              )}
            </p>

            {genres.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <li key={genre.id}>
                    <Badge>{genre.name}</Badge>
                  </li>
                ))}
              </ul>
            )}

            {credit && credit.names.length > 0 && (
              <p className="mt-5 text-sm text-fg-muted">
                {credit.label} <span className="text-fg">{credit.names.join(", ")}</span>
              </p>
            )}

            {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
          </div>
        </div>
      </Container>
    </>
  );
}
