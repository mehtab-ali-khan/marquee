"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Plus, Star } from "lucide-react";
import { TrailerButton } from "@/components/media/TrailerButton";
import { updateLibrary } from "@/features/library/actions";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import type { PreviewDetails } from "@/lib/tmdb/preview";
import { setModalOrigin } from "./modal-origin";
import type { Anchor, PreviewItem } from "./PreviewLayer";

// The enlarged hover preview (Netflix's "mini modal").
//
// FLIP animation ("First, Last, Invert, Play"):
//   1. LAST:   lay the preview out at its final size and place (1.5× the card).
//   2. INVERT: scale it down so it exactly covers the card (scale = card ÷ preview width).
//   3. PLAY:   spring the scale back to 1, so it seems to GROW out of the card.
// Only `transform` and `opacity` animate: the GPU handles those, so it stays smooth.

const GUTTER = 16; // never closer than this to the window edge
const SCALE = 1.5; // preview width = 1.5 × card width (like Netflix)
const MIN_WIDTH = 320;
const SPRING = { type: "spring", stiffness: 420, damping: 36, mass: 0.9 } as const;

// Details already fetched in this visit (re-hovering a card is instant).
const detailsCache = new Map<string, PreviewDetails>();

type TitlePreviewProps = {
  item: PreviewItem;
  anchor: Anchor;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onLockChange: (locked: boolean) => void;
  /** The card this preview belongs to: the detail modal shrinks back into it. */
  card: HTMLElement;
  /** Called when "More info" opens the detail modal (the preview closes). */
  onOpenDetails: () => void;
};

export function TitlePreview({ item, anchor, card, onOpenDetails, onPointerEnter, onPointerLeave, onLockChange }: TitlePreviewProps) {
  const reduceMotion = useReducedMotion();
  const previewRef = useRef<HTMLDivElement>(null);

  // "More info": the modal grows out of THIS preview and later returns into the card.
  function openDetails(event: React.MouseEvent) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; // new tab etc.
    const from = previewRef.current?.getBoundingClientRect();
    if (from) setModalOrigin({ from, returnTo: card });
    onOpenDetails();
  }
  const [details, setDetails] = useState<PreviewDetails | null>(() => detailsCache.get(item.key) ?? null);
  const [hiResLoaded, setHiResLoaded] = useState(false);

  // Where the preview goes. Measured once, when it opens (the anchor doesn't change).
  const box = useMemo(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const width = Math.min(Math.max(anchor.width * SCALE, MIN_WIDTH), viewportWidth - GUTTER * 2);
    const imageHeight = (width * 9) / 16;
    const cardCenterX = anchor.left + anchor.width / 2;
    const cardCenterY = anchor.top + anchor.height / 2;
    // Centered on the card, but clamped so the first/last card's preview stays on screen.
    const minLeft = window.scrollX + GUTTER;
    const maxLeft = window.scrollX + viewportWidth - GUTTER - width;
    const left = Math.min(Math.max(cardCenterX - width / 2, minLeft), maxLeft);
    // The IMAGE part is centered on the card; the info panel hangs below it.
    const top = cardCenterY - imageHeight / 2;
    return {
      left,
      top,
      width,
      startScale: anchor.width / width,
      // Grow from the card's center, even when the box was pushed sideways by clamping.
      origin: `${cardCenterX - left}px ${imageHeight / 2}px`,
    };
  }, [anchor]);

  useEffect(() => {
    if (detailsCache.has(item.key)) return;
    const controller = new AbortController();
    fetch(`/api/preview/${item.type}/${item.id}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<PreviewDetails>) : Promise.reject(res.status)))
      .then((data) => {
        detailsCache.set(item.key, data);
        setDetails(data);
      })
      .catch(() => {}); // the preview still works without details
    return () => controller.abort();
  }, [item.key, item.type, item.id]);

  const lowRes = backdropUrl(item.backdropPath, "w780") ?? posterUrl(item.posterPath, "w500");
  const hiRes = backdropUrl(item.backdropPath, "w1280");
  const facts = [item.year, ...(details?.facts ?? [])].filter(Boolean);

  return (
    <motion.div
      ref={previewRef}
      role="dialog"
      aria-label={`${item.title} preview`}
      className="absolute z-50 overflow-hidden rounded-lg bg-surface shadow-[0_16px_48px_-12px_rgb(0_0_0/0.85),0_0_0_1px_rgb(255_255_255/0.06)]"
      style={{ left: box.left, top: box.top, width: box.width, transformOrigin: box.origin }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: box.startScale }}
      animate={{ opacity: 1, scale: 1, transition: { scale: SPRING, opacity: { duration: 0.12 } } }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: { duration: 0.12 } }
          : { opacity: 0, scale: box.startScale, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }
      }
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Image area (16:9) with a slow "Ken Burns" zoom instead of a video. */}
      <Link href={item.href} scroll={false} onClick={openDetails} tabIndex={-1} className="relative block aspect-video overflow-hidden bg-raised">
        <div className="ken-burns absolute inset-0">
          {lowRes && (
            // Same src + sizes as the card → the browser already has this file: instant.
            <Image src={lowRes} alt="" fill sizes={item.imageSizes} className="object-cover" />
          )}
          {hiRes && (
            // A sharper version for the bigger size, faded in once it has loaded.
            <Image
              src={hiRes}
              alt=""
              fill
              sizes={`${Math.round(box.width)}px`}
              onLoad={() => setHiResLoaded(true)}
              className="object-cover transition-opacity duration-300"
              style={{ opacity: hiResLoaded ? 1 : 0 }}
            />
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface via-surface/25 to-transparent px-4 pt-12 pb-2">
          <p className="line-clamp-2 font-display text-xl leading-tight text-fg [text-shadow:0_1px_12px_rgb(0_0_0/0.6)]">
            {item.title}
          </p>
        </div>
      </Link>

      <div className="px-4 pt-1 pb-4">
        {/* Actions */}
        <div className="flex items-center gap-2">
          {details?.trailerKey ? (
            <TrailerButton variant="icon" youtubeKey={details.trailerKey} title={item.title} onOpenChange={onLockChange} />
          ) : (
            <span className="size-10 rounded-full bg-raised" aria-hidden="true" />
          )}
          <WatchlistToggle item={item} details={details} />
          <Link
            href={item.href}
            scroll={false}
            onClick={openDetails}
            aria-label={`More info about ${item.title}`}
            title="More info"
            className="ml-auto grid size-10 place-items-center rounded-full border border-white/20 text-fg transition-colors duration-150 hover:border-fg"
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Metadata: fixed heights, so nothing jumps when the details arrive. */}
        <p className="mt-3 flex h-5 items-center gap-2 text-sm text-fg-muted tabular-nums">
          {item.rating > 0 && (
            <span className="flex items-center gap-1 font-medium text-fg">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
              {item.rating.toFixed(1)}
            </span>
          )}
          {facts.map((fact) => (
            <span key={fact} className="before:mr-2 before:text-fg-subtle before:content-['·'] first:before:hidden">
              {fact}
            </span>
          ))}
          {!details && <span className="h-3 w-14 rounded-sm bg-raised" aria-hidden="true" />}
        </p>
        <p className="mt-1.5 h-5 truncate text-sm text-fg-subtle">
          {details ? details.genres.join(" • ") : <span className="inline-block h-3 w-28 rounded-sm bg-raised" aria-hidden="true" />}
        </p>
      </div>
    </motion.div>
  );
}

/** + / ✓ watchlist button. Optimistic: flips instantly, reverts if TMDB refuses. */
function WatchlistToggle({ item, details }: { item: PreviewItem; details: PreviewDetails | null }) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const on = saved ?? details?.library.watchlist ?? false;
  const className =
    "grid size-10 place-items-center rounded-full border border-white/20 text-fg transition-colors duration-150 hover:border-fg disabled:opacity-60";

  if (!details) return <span className="size-10 rounded-full border border-white/10" aria-hidden="true" />;

  if (!details.library.signedIn) {
    return (
      <Link href="/login?next=/" aria-label="Sign in to add to your watchlist" title="Add to watchlist" className={className}>
        <Plus className="size-4" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${item.title} from watchlist` : `Add ${item.title} to watchlist`}
      title={on ? "In your watchlist" : "Add to watchlist"}
      disabled={pending}
      className={className}
      onClick={() => {
        const next = !on;
        setSaved(next); // optimistic
        startTransition(async () => {
          const result = await updateLibrary(item.type, item.id, "watchlist", next).catch(() => ({ error: "failed" }));
          if (result.error) {
            setSaved(!next); // revert
          } else {
            const cached = detailsCache.get(item.key);
            if (cached) detailsCache.set(item.key, { ...cached, library: { ...cached.library, watchlist: next } });
          }
        });
      }}
    >
      {on ? <Check className="size-4 text-accent" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
    </button>
  );
}
