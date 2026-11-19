"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { MediaCard } from "@/components/media/MediaCard";
import { Button } from "@/components/ui/Button";
import type { CardData } from "@/lib/tmdb/cards";

// A poster grid that loads more titles as you scroll near the bottom.
// Page 1 arrives already rendered from the server (fast first paint, good SEO);
// this component then fetches pages 2, 3, ... from /api/discover in the browser.

type InfiniteGridProps = {
  initialItems: CardData[];
  totalPages: number;
  query: string; // the filters as a query string, e.g. "type=tv&genre=18"
};

export function InfiniteGrid({ initialItems, totalPages, query }: InfiniteGridProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = page < totalPages;

  async function loadMore() {
    if (status === "loading" || !hasMore) return;
    setStatus("loading");
    try {
      const next = page + 1;
      const res = await fetch(`/api/discover?${query}${query ? "&" : ""}page=${next}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: CardData[] };

      // TMDB's popularity order can shift between requests, so a title might
      // appear on two pages. Skip ones we already show (duplicate React keys break lists).
      setItems((current) => {
        const seen = new Set(current.map((item) => item.key));
        return [...current, ...data.items.filter((item) => !seen.has(item.key))];
      });
      setPage(next);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  // IntersectionObserver: the browser tells us when the invisible "sentinel"
  // div below the grid comes near the screen (800px early), and we load more.
  // Much cheaper than listening to every scroll event.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || status !== "idle") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "800px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // loadMore reads the latest page/status, and this effect re-runs when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, status, page]);

  if (items.length === 0) {
    return <p className="py-16 text-fg-muted">No titles match these filters. Try widening them.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-5">
        {items.map(({ key, ...card }) => (
          <MediaCard key={key} {...card} />
        ))}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />

      {/* Status area. aria-live: screen readers announce "Loading more…" etc. */}
      <div className="mt-10 flex justify-center" aria-live="polite">
        {status === "loading" && (
          <span className="flex items-center gap-2 text-sm text-fg-subtle">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading more…
          </span>
        )}
        {status === "error" && (
          <Button variant="secondary" onClick={() => setStatus("idle")}>
            Couldn’t load more. Try again
          </Button>
        )}
        {!hasMore && <span className="text-sm text-fg-subtle">You’ve reached the end.</span>}
      </div>
    </>
  );
}
