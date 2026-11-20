import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { posterUrl } from "@/lib/tmdb/images";

// A poster card used everywhere: home rows, discover grid, search, library.
// It takes simple props (not a TMDB object), so it works for movies AND TV:
// the parent decides what title/year/link to pass.

type MediaCardProps = {
  href: string;
  title: string;
  posterPath: string | null;
  year?: string; // "2024"
  rating?: number; // 0–10
  /** true for the first cards visible without scrolling: load now, not lazily. */
  eager?: boolean;
};

export function MediaCard({ href, title, posterPath, year, rating, eager = false }: MediaCardProps) {
  const src = posterUrl(posterPath, "w342");

  return (
    // "group" lets children react when the WHOLE card is hovered (group-hover:...).
    <Link href={href} className="group block rounded-md">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-line bg-surface transition-transform duration-250 ease-out-soft group-hover:-translate-y-1">
        {src ? (
          <Image
            src={src}
            alt={`Poster for ${title}`}
            fill // fill the parent box (which has the 2:3 shape)
            // How wide the card is on screen, so the browser downloads a small enough file:
            // 2 per row on phones, about 6 per row on desktop.
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 15vw"
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition-transform duration-250 ease-out-soft group-hover:scale-[1.03]"
          />
        ) : (
          // No poster on TMDB: show the title instead of a broken image.
          <div className="flex size-full items-end bg-[linear-gradient(160deg,var(--color-raised),var(--color-canvas))] p-3">
            <span className="font-display text-lg leading-tight text-fg-muted">{title}</span>
          </div>
        )}
      </div>

      <h3 className="mt-3 truncate font-sans text-sm font-medium tracking-normal text-fg">{title}</h3>
      <p className="mt-0.5 flex items-center gap-2 text-xs text-fg-subtle tabular-nums">
        {year && <span>{year}</span>}
        {rating ? (
          <span className="flex items-center gap-1">
            <Star className="size-3 fill-accent text-accent" aria-hidden="true" />
            {rating.toFixed(1)}
          </span>
        ) : null}
      </p>
    </Link>
  );
}
