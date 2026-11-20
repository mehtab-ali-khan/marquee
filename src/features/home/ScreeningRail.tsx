"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

type RailFormat = "still" | "poster";
type Preview = { id: string; pinned: boolean };

const PreviewContext = createContext<{
  preview: Preview | null;
  hover: (id: string) => void;
  leave: (id: string) => void;
  toggle: (id: string) => void;
  close: () => void;
} | null>(null);

export function useScreeningPreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("Screening cards must be rendered inside a screening rail.");
  return context;
}

const scrollButton =
  "grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-colors enabled:hover:border-accent/60 enabled:hover:text-accent disabled:opacity-35";

export function ScreeningRail({ title, format, loading = false, children }: {
  title: string;
  format: RailFormat;
  loading?: boolean;
  children: ReactNode;
}) {
  const track = useRef<HTMLUListElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const titleId = useId();
  const trackId = useId();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });

  function cancelHover() {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  }

  useEffect(() => () => cancelHover(), []);

  function hover(id: string) {
    cancelHover();
    if (preview?.id === id || preview?.pinned) return;
    hoverTimer.current = window.setTimeout(() => {
      setPreview((current) => current?.pinned ? current : { id, pinned: false });
    }, 220);
  }

  function leave(id: string) {
    cancelHover();
    if (preview?.id !== id || preview.pinned) return;
    hoverTimer.current = window.setTimeout(() => {
      setPreview((current) => current?.id === id && !current.pinned ? null : current);
    }, 130);
  }

  function toggle(id: string) {
    cancelHover();
    setPreview((current) => current?.id === id && current.pinned ? null : { id, pinned: true });
  }

  function close() {
    cancelHover();
    setPreview(null);
  }

  // A preview near the right edge needs space as its width changes.
  const activeId = preview?.id;
  useEffect(() => {
    const list = track.current;
    if (!list || loading) return;

    const activeCard = activeId
      ? Array.from(list.children).find((item) => item.getAttribute("data-screening-card") === activeId)
      : undefined;

    function fitExpandedCard() {
      if (!list) return;
      if (activeCard) {
        const card = activeCard.getBoundingClientRect();
        const rail = list.getBoundingClientRect();
        if (card.right > rail.right - 4) list.scrollLeft += card.right - rail.right + 4;
        else if (card.left < rail.left + 4) list.scrollLeft += card.left - rail.left - 4;
      }
      measureEdges();
    }

    function measureEdges() {
      if (!list) return;
      const previous = list.scrollLeft > 2;
      const next = list.scrollLeft < list.scrollWidth - list.clientWidth - 2;
      setEdges((current) => current.previous === previous && current.next === next ? current : { previous, next });
    }

    const observer = new ResizeObserver(fitExpandedCard);
    observer.observe(list);
    if (activeCard) observer.observe(activeCard);
    list.addEventListener("scroll", measureEdges, { passive: true });
    fitExpandedCard();
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", measureEdges);
    };
  }, [activeId, loading]);

  const pinned = preview?.pinned;
  useEffect(() => {
    if (!activeId) return;

    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Element &&
        event.target.closest("[data-screening-card]")?.getAttribute("data-screening-card") === activeId) return;
      setPreview(null);
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(null);
    }

    if (pinned) document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      if (pinned) document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [activeId, pinned]);

  function advance(direction: number) {
    const list = track.current;
    if (!list) return;
    close();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: direction * list.clientWidth * 0.78, behavior: reduce ? "instant" : "smooth" });
  }

  return (
    <section aria-labelledby={titleId} aria-busy={loading} className="py-5 sm:py-7">
      <Container>
        <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
          <h2 id={titleId} className={format === "still" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}>{title}</h2>
          <div className="flex shrink-0 gap-2">
            <button type="button" className={scrollButton} aria-controls={trackId}
              aria-label={`Previous in ${title}`} disabled={!edges.previous} onClick={() => advance(-1)}>
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className={scrollButton} aria-controls={trackId}
              aria-label={`Next in ${title}`} disabled={!edges.next} onClick={() => advance(1)}>
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <ul id={trackId} ref={track} data-format={format} data-preview-open={Boolean(preview)}
          className="screening-rail -mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pt-1 pb-3 scrollbar-none sm:gap-4 md:-mx-6 md:px-6 lg:-mx-12 lg:px-12">
          <PreviewContext.Provider value={{ preview, hover, leave, toggle, close }}>
            {children}
          </PreviewContext.Provider>
        </ul>
      </Container>
    </section>
  );
}
