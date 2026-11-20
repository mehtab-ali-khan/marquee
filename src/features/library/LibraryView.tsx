"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight, Bookmark, Heart, Loader2, Star, X } from "lucide-react";
import { MediaCard } from "@/components/media/MediaCard";
import { Button, buttonStyles } from "@/components/ui/Button";
import { SegmentedLinks } from "@/components/ui/SegmentedLinks";
import type { LibraryItem, LibraryOverview, LibraryPage } from "@/lib/tmdb/library";
import { updateLibrary } from "./actions";
import { shelves, type LibraryMediaType, type Shelf } from "./selection";

// The whole library, already loaded: the server sends page 1 of every shelf
// (films + series) in one go, so switching tabs is instant: no spinner, no request.
// Only "Show more" (page 2+) goes back to the network.
//
// Removing a title is optimistic: it disappears right away (with an Undo),
// and comes back with an error message if TMDB refuses the change.

const icons = { watchlist: Bookmark, favorite: Heart, rated: Star };
const emptyCopy: Record<Shelf, { title: string; body: string }> = {
  watchlist: { title: "Your watchlist is empty", body: "Save a film or series for later and it will wait for you here." },
  favorite: { title: "No favorites yet", body: "Mark the titles you love with the heart and they’ll be collected here." },
  rated: { title: "Nothing rated yet", body: "Rate what you’ve watched; your scores show up here." },
};
const sections: { type: LibraryMediaType; label: string }[] = [
  { type: "movie", label: "Films" },
  { type: "tv", label: "Series" },
];

type Removal = { shelf: Shelf; item: LibraryItem };

export function LibraryView({ overview }: { overview: LibraryOverview }) {
  // The tab lives in the URL (?tab=rated) so it survives reloads and can be shared.
  // pushState (below) updates useSearchParams without a server request.
  const params = useSearchParams();
  const shelf = shelves.find((s) => s.value === params.get("tab"))?.value ?? "watchlist";

  // Pages 2, 3, … loaded with "Show more", per shelf + type ("rated:tv").
  const [extra, setExtra] = useState<Record<string, LibraryPage>>({});
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  // Titles removed in this visit. Kept even after the server re-renders,
  // because TMDB can take a few seconds before its lists reflect a change.
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [lastRemoval, setLastRemoval] = useState<Removal | null>(null);
  // Titles put back with Undo: shown even if the server list (TMDB lags) still lacks them.
  const [restored, setRestored] = useState<Removal[]>([]);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const idFor = (s: Shelf, item: LibraryItem) => `${s}:${item.key}`;

  function itemsFor(s: Shelf, type: LibraryMediaType) {
    const key = `${s}:${type}`;
    const first = overview[s][type];
    const putBack = restored.filter((r) => r.shelf === s && r.item.type === type).map((r) => r.item);
    const all = [...putBack, ...first.items, ...(extra[key]?.items ?? [])];
    const seen = new Set<string>();
    const items = all.filter((item) => !seen.has(item.key) && seen.add(item.key) && !removed.has(idFor(s, item)));
    const lastPage = extra[key]?.page ?? 1;
    const removedHere = all.filter((item) => removed.has(idFor(s, item))).length;
    const missingFromServer = putBack.filter((item) => !first.items.some((i) => i.key === item.key)).length;
    return { items, total: Math.max(0, first.totalResults - removedHere + missingFromServer), hasMore: lastPage < first.totalPages, nextPage: lastPage + 1 };
  }

  const count = (s: Shelf) => itemsFor(s, "movie").total + itemsFor(s, "tv").total;

  function selectShelf(index: number) {
    const next = shelves[index].value;
    window.history.pushState(null, "", next === "watchlist" ? "/library" : `/library?tab=${next}`);
    setLastRemoval(null);
  }

  async function showMore(type: LibraryMediaType, page: number) {
    const key = `${shelf}:${type}`;
    setLoadingMore(key);
    setError("");
    try {
      const res = await fetch(`/api/library?tab=${shelf}&type=${type}&page=${page}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as LibraryPage;
      setExtra((current) => ({
        ...current,
        [key]: { ...data, items: [...(current[key]?.items ?? []), ...data.items] },
      }));
    } catch {
      setError("Couldn’t load more titles. Try again.");
    } finally {
      setLoadingMore(null);
    }
  }

  /** shelf → the TMDB change that takes a title OFF (or back ON) that shelf. */
  function change(s: Shelf, item: LibraryItem, putBack: boolean) {
    if (s === "rated") return updateLibrary(item.type, item.id, "rating", putBack ? (item.userRating ?? 0) : 0);
    return updateLibrary(item.type, item.id, s, putBack);
  }

  function remove(s: Shelf, item: LibraryItem) {
    const id = idFor(s, item);
    setError("");
    setRemoved((current) => new Set(current).add(id));
    setLastRemoval({ shelf: s, item });
    setRestored((current) => current.filter((r) => idFor(r.shelf, r.item) !== id));
    startTransition(async () => {
      const result = await change(s, item, false).catch(() => ({ error: "Couldn’t remove that title. Try again." }));
      if (result.error) {
        setRemoved((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        setLastRemoval(null);
        setError(result.error);
      }
    });
  }

  function undo() {
    if (!lastRemoval) return;
    const { shelf: s, item } = lastRemoval;
    setLastRemoval(null);
    setRestored((current) => [lastRemoval, ...current]);
    setRemoved((current) => {
      const next = new Set(current);
      next.delete(idFor(s, item));
      return next;
    });
    startTransition(async () => {
      const result = await change(s, item, true).catch(() => ({ error: "Couldn’t undo. Try again." }));
      if (result.error) setError(result.error);
    });
  }

  const total = count(shelf);
  const Icon = icons[shelf];

  return (
    <MotionConfig reducedMotion="user">
      <SegmentedLinks
        label="Library shelves"
        activeIndex={shelves.findIndex((s) => s.value === shelf)}
        onSelect={selectShelf}
        items={shelves.map((s) => ({
          label: s.label,
          count: count(s.value),
          href: s.value === "watchlist" ? "/library" : `/library?tab=${s.value}`,
        }))}
      />

      {/* Status line: errors and the Undo for the last removal. */}
      <div className="mt-4 min-h-10" aria-live="polite">
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && lastRemoval && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <span>
              Removed <span className="text-fg">{lastRemoval.item.title}</span> from {shelves.find((s) => s.value === lastRemoval.shelf)?.label.toLowerCase()}.
            </span>
            <button type="button" onClick={undo} className="font-medium text-accent underline-offset-4 hover:underline">
              Undo
            </button>
          </p>
        )}
      </div>

      {total === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full border border-accent/40 bg-accent/10">
            <Icon aria-hidden="true" className="size-6 text-accent" />
          </span>
          <h2 className="mt-5 text-3xl">{emptyCopy[shelf].title}</h2>
          <p className="mt-3 text-fg-muted">{emptyCopy[shelf].body}</p>
          <Link href="/discover" className={buttonStyles({ className: "mt-7 rounded-full" })}>
            Find something to watch <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="space-y-14">
          {sections.map(({ type, label }) => {
            const { items, total: sectionTotal, hasMore, nextPage } = itemsFor(shelf, type);
            if (sectionTotal === 0) return null;
            const key = `${shelf}:${type}`;
            return (
              <section key={key} aria-labelledby={`${key}-heading`}>
                <h2 id={`${key}-heading`} className="mb-5 flex items-center gap-3 font-sans text-xs font-semibold tracking-[0.22em] text-fg uppercase">
                  <span className="h-px w-6 bg-accent" aria-hidden="true" />
                  {label}
                  <span className="text-fg-subtle tabular-nums">{sectionTotal}</span>
                </h2>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.key}
                        layout
                        exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 420, damping: 38 }}
                        className="group/card relative"
                      >
                        <MediaCard href={item.href} title={item.title} posterPath={item.posterPath} year={item.year} rating={item.rating} />
                        {shelf === "rated" && item.userRating !== undefined && (
                          <span
                            className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-accent/50 bg-canvas/85 px-2 py-0.5 text-xs font-semibold text-accent tabular-nums backdrop-blur-sm"
                            aria-label={`You rated it ${item.userRating} out of 10`}
                          >
                            <Star className="size-3 fill-accent" aria-hidden="true" /> {item.userRating}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(shelf, item)}
                          aria-label={`Remove ${item.title} from ${shelves.find((s) => s.value === shelf)?.label.toLowerCase()}`}
                          className="absolute top-2 right-2 grid size-8 place-items-center rounded-full border border-line bg-canvas/85 text-fg-muted opacity-0 backdrop-blur-sm transition-[opacity,color,border-color,transform] duration-150 group-hover/card:opacity-100 hover:border-danger/60 hover:text-danger focus-visible:opacity-100 active:scale-90 [@media(hover:none)]:opacity-100"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button variant="secondary" className="rounded-full" disabled={loadingMore === key} onClick={() => showMore(type, nextPage)}>
                      {loadingMore === key ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                      Show more {label.toLowerCase()}
                    </Button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </MotionConfig>
  );
}
