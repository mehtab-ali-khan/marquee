import Image from "next/image";
import { posterUrl } from "@/lib/tmdb/images";

// One season in a show's season row: poster, "Season 1", episodes and year.
// Same shape as MediaCard so it sits nicely in a MediaRail. Not a link yet:
// a page per season (with its episode list) can come later.

type SeasonCardProps = {
  name: string; // "Season 1"
  posterPath: string | null;
  episodeCount: number;
  airDate: string | null; // "2008-01-20"
};

export function SeasonCard({ name, posterPath, episodeCount, airDate }: SeasonCardProps) {
  const src = posterUrl(posterPath, "w342");
  const year = airDate?.slice(0, 4);

  return (
    <div>
      <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-line bg-surface">
        {src ? (
          <Image
            src={src}
            alt={`Poster for ${name}`}
            fill
            sizes="(max-width: 640px) 45vw, 12rem"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-end bg-[linear-gradient(160deg,var(--color-raised),var(--color-canvas))] p-3">
            <span className="font-display text-lg leading-tight text-fg-muted">{name}</span>
          </div>
        )}
      </div>
      <h3 className="mt-3 truncate font-sans text-sm font-medium tracking-normal">{name}</h3>
      <p className="mt-0.5 text-xs text-fg-subtle tabular-nums">
        {episodeCount} {episodeCount === 1 ? "episode" : "episodes"}
        {year && ` · ${year}`}
      </p>
    </div>
  );
}
