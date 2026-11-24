"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// The program's table of contents: "01 Story  02 Episodes  03 Credits ...".
// - Sticks under the header for the WHOLE page (its parent must be the page
//   itself: a sticky element can only stick inside its parent's box).
// - A brass pill slides to the current chapter and follows the mouse on hover,
//   the same motion as the header's nav (.marquee-nav-indicator).

type ChapterLink = { id: string; label: string };

export function ChapterNav({ chapters, className }: { chapters: ChapterLink[]; className?: string }) {
  const [current, setCurrent] = useState(chapters[0]?.id);
  const [hovered, setHovered] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const pillRef = useRef<HTMLLIElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  // Which chapter you're reading: the LAST one whose top has scrolled up under
  // the sticky header + this bar (~180px). At the very bottom, the last one.
  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((el): el is HTMLElement => el !== null);

    let frame = 0;
    function update() {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let active = sections[0]?.id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 180) active = section.id;
      }
      if (atBottom && sections.length) active = sections[sections.length - 1].id;
      setCurrent(active);
    }
    // requestAnimationFrame: at most one update per frame, however fast you scroll.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [chapters]);

  // Move the pill under the hovered (or else the current) chapter. Written
  // straight to the DOM (no state): it only drives a CSS transition.
  const target = hovered ?? current;
  useLayoutEffect(() => {
    const place = () => {
      const link = target ? linkRefs.current.get(target) : undefined;
      const pill = pillRef.current;
      if (!link || !pill) return;
      pill.style.width = `${link.offsetWidth}px`;
      pill.style.transform = `translateX(${link.offsetLeft}px)`;
      pill.dataset.active = "true";
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [target]);

  // On narrow screens the bar scrolls sideways: keep the current chapter visible.
  useEffect(() => {
    const list = listRef.current;
    const link = current ? linkRefs.current.get(current) : undefined;
    if (!list || !link || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: link.offsetLeft - list.clientWidth / 2 + link.offsetWidth / 2, behavior: "smooth" });
  }, [current]);

  function jump(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const section = document.getElementById(id);
    if (!section) return; // let the normal #anchor jump happen
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`); // shareable, without piling up history entries
    setCurrent(id);
  }

  return (
    <nav
      aria-label="Chapters"
      className={cn(
        "sticky top-[var(--marquee-header-height)] z-30 border-y border-line bg-canvas/90 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-page px-4 md:px-6 lg:px-12">
        <ol
          ref={listRef}
          className="relative isolate flex gap-1 overflow-x-auto py-2 scrollbar-none"
          onPointerLeave={() => setHovered(null)}
        >
          {/* The sliding pill (same look and timing as the header nav). */}
          <li
            ref={pillRef}
            aria-hidden="true"
            className="marquee-nav-indicator pointer-events-none absolute inset-y-2 left-0 -z-10 rounded-full border border-accent/40 bg-accent/10"
            style={{ transitionProperty: "transform, width, opacity" }}
          />
          {chapters.map((chapter, index) => {
            const active = chapter.id === current;
            return (
              <li key={chapter.id} className="shrink-0">
                <a
                  ref={(node) => {
                    if (node) linkRefs.current.set(chapter.id, node);
                    else linkRefs.current.delete(chapter.id);
                  }}
                  href={`#${chapter.id}`}
                  onClick={(event) => jump(event, chapter.id)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setHovered(chapter.id);
                  }}
                  aria-current={active ? "location" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-full px-4 text-sm whitespace-nowrap transition-colors duration-200",
                    active ? "text-fg" : "text-fg-subtle hover:text-fg",
                  )}
                >
                  <span className={cn("text-xs tabular-nums transition-colors duration-200", active ? "text-accent" : "text-fg-subtle")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {chapter.label}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
