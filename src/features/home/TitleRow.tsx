"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { usePreview } from "./PreviewLayer";

// A titled row of 16:9 cards. Native horizontal scrolling (trackpad swipe,
// touch, shift+wheel) PLUS Netflix-style paging buttons for mouse users.
// Netflix disables native scrolling; we keep it so phones and trackpads work.

const pageButton =
  "grid size-9 place-items-center rounded-full border border-line text-fg-muted transition-[color,border-color,opacity] duration-150 enabled:hover:border-fg-subtle enabled:hover:text-fg disabled:opacity-30";

export function TitleRow({ title, children }: { title: string; children: ReactNode }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const titleId = useId();
  const { closeNow } = usePreview();
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const start = track.scrollLeft <= 2;
    const end = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  function page(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    closeNow();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // ~one screenful, leaving a sliver of the previous page for context.
    track.scrollBy({ left: direction * track.clientWidth * 0.92, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby={titleId} className="py-3 sm:py-4">
      <Container>
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 id={titleId} className="text-xl sm:text-2xl">
            {title}
          </h2>
          <div className="hidden gap-2 sm:flex">
            <button type="button" className={pageButton} aria-label={`Previous titles in ${title}`} disabled={edges.start} onClick={() => page(-1)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className={pageButton} aria-label={`More titles in ${title}`} disabled={edges.end} onClick={() => page(1)}>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {/* A preview is positioned on the page; if the row scrolls under it, close it. */}
        <ul
          ref={trackRef}
          className="title-row"
          onScroll={() => {
            closeNow();
            measure();
          }}
        >
          {children}
        </ul>
      </Container>
    </section>
  );
}

export function TitleRowSkeleton({ title }: { title: string }) {
  return (
    <section aria-busy="true" className="py-3 sm:py-4">
      <Container>
        <h2 className="mb-3 text-xl sm:text-2xl">{title}</h2>
        <ul className="title-row" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <div className="aspect-video animate-shimmer rounded-md bg-surface bg-[linear-gradient(90deg,transparent_0%,var(--color-raised)_50%,transparent_100%)] bg-size-[200%_100%] bg-no-repeat" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
