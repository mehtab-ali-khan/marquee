"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, Maximize2, Star, X } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { cn } from "@/lib/utils";
import { useScreeningPreview } from "./ScreeningRail";

type Format = "still" | "poster";

export function ScreeningCard({ format, title, href, year, rating, overview, posterPath, backdropPath }: {
  format: Format;
  title: string;
  href: string;
  year?: string;
  rating?: number;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
}) {
  const { preview, hover, leave, toggle, close } = useScreeningPreview();
  const previewId = useId();
  const previewButton = useRef<HTMLButtonElement>(null);
  const [artLoaded, setArtLoaded] = useState(false);
  const open = preview?.id === href;
  const pinned = open && preview.pinned;
  const backdrop = backdropUrl(backdropPath, "w780");
  const source = (format === "still" ? backdrop : null) ?? posterUrl(posterPath, "w342");

  return (
    <li data-screening-card={href} data-expanded={open}
      className="screening-card relative isolate"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") hover(href); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") leave(href); }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.stopPropagation();
        previewButton.current?.focus({ preventScroll: true });
        close();
      }}>
      <Link href={href} prefetch={false} aria-label={title} className="absolute inset-0 z-[1] rounded-md" />
      <div className="screening-card-artwork relative rounded-md border border-white/10 bg-surface">
        <div className="screening-card-size" aria-hidden="true" />
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[inherit]">
          {source ? (
            <Image src={source} alt="" fill
              sizes={format === "still" ? "(min-width: 1440px) 560px, (min-width: 1024px) 42vw, (min-width: 640px) 62vw, 92vw" : "(min-width: 1024px) 172px, (min-width: 640px) 156px, 132px"}
              className="screening-card-image object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center text-fg-muted"><Clapperboard aria-hidden="true" className="size-7" /></span>
          )}
        </div>
        {open && format === "poster" && backdrop && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <Image src={backdrop} alt="" fill sizes="(min-width: 640px) 360px, 92vw" loading="eager"
              onLoad={() => setArtLoaded(true)}
              className={cn("object-cover transition-opacity duration-300", artLoaded ? "opacity-100" : "opacity-0")}
            />
          </div>
        )}

        <button ref={previewButton} type="button" aria-controls={previewId} aria-expanded={open}
          aria-label={pinned ? `Close preview for ${title}` : open ? `Keep preview open for ${title}` : `Preview ${title}`}
          className="screening-preview-toggle absolute top-2 right-2 z-10 grid size-10 place-items-center rounded-full border border-white/20 bg-black/65 text-fg hover:border-accent/65 hover:text-accent"
          onClick={() => toggle(href)}>
          {pinned ? <X aria-hidden="true" className="size-4" /> : <Maximize2 aria-hidden="true" className="size-4" />}
        </button>

        <div id={previewId} inert={!open}
          className="screening-card-preview pointer-events-none absolute inset-0 z-[2] flex flex-col justify-end overflow-hidden rounded-[inherit]">
          <div className="screening-card-preview-copy bg-linear-to-t from-black via-black/90 to-transparent px-3 pt-7 pb-3 sm:px-4 sm:pt-9 sm:pb-4">
            {overview && <p className="mb-2.5 line-clamp-2 max-w-lg text-xs leading-relaxed text-white/90 sm:text-sm">{overview}</p>}
            <Link href={href} prefetch={false}
              className="pointer-events-auto inline-flex min-h-8 w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-hover">
              View details <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-2 min-w-0">
        <h3 className="truncate font-sans text-sm font-semibold tracking-normal sm:text-base">{title}</h3>
        <p className="flex min-h-5 items-center gap-2 text-xs text-fg-muted tabular-nums">
          {year && <span>{year}</span>}
          {rating !== undefined && rating > 0 && (
            <span className="inline-flex items-center gap-1"><Star aria-hidden="true" className="size-3 fill-accent text-accent" />{rating.toFixed(1)}</span>
          )}
        </p>
      </div>
    </li>
  );
}

export function ScreeningCardSkeleton() {
  return (
    <li>
      <Skeleton className="screening-card-size rounded-md" />
      <Skeleton className="mt-2 h-5 w-4/5" />
      <Skeleton className="mt-0.5 h-[1.125rem] w-1/3" />
    </li>
  );
}
