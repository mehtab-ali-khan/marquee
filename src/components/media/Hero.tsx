"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";

export type FeaturedTitle = {
  href: string;
  title: string;
  overview: string;
  backdropPath: string | null;
  posterPath: string | null;
  year?: string;
  rating: number;
};

type SlideState = { index: number; previous: number | null; direction: 1 | -1 };

function stepSlide(current: SlideState, direction: 1 | -1, length: number): SlideState {
  return {
    index: (current.index + direction + length) % length,
    previous: current.index,
    direction,
  };
}

// Time each featured movie stays on screen before the next one slides in.
const ROTATION_MS = 5_000;
const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotion() {
  return window.matchMedia(motionQuery).matches;
}

const controlClass =
  "grid size-10 place-items-center rounded-full border border-white/20 bg-black/30 text-fg transition-colors hover:border-accent/70 hover:bg-black/65 hover:text-accent";

export function Hero({ slides }: { slides: [FeaturedTitle, ...FeaturedTitle[]] }) {
  const region = useRef<HTMLElement>(null);
  const [slideState, setSlideState] = useState<SlideState>({ index: 0, previous: null, direction: 1 });
  const { index, previous, direction } = slideState;
  const [focusInside, setFocusInside] = useState(false);
  // Like Netflix: while the mouse rests on the hero, it stays on this title.
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [warm, setWarm] = useState(() => !slides[0].backdropPath && !slides[0].posterPath);
  const [artReady, setArtReady] = useState<Record<string, boolean>>({});
  const [announcement, setAnnouncement] = useState("");
  const reducedMotion = useSyncExternalStore(subscribeToMotion, getReducedMotion, () => false);
  const active = slides[index] ?? slides[0];
  const multiple = slides.length > 1;
  const nextSlide = slides[(index + 1) % slides.length];
  const nextArtwork = backdropUrl(nextSlide.backdropPath) ?? posterUrl(nextSlide.posterPath, "w780");
  const nextArtworkReady = !nextArtwork || Boolean(artReady[nextSlide.href]);
  // Rotation pauses when: reduced motion is on, the hero is scrolled away, the tab
  // is in the background, keyboard focus is inside it, or the mouse is over it.
  const rotating = multiple && !reducedMotion && inView && pageVisible && !focusInside && !hovered;

  useEffect(() => {
    const element = region.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= 0.3), { threshold: 0.3 });
    observer.observe(element);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!rotating || !nextArtworkReady) return;
    const timer = window.setTimeout(() => setSlideState((current) => stepSlide(current, 1, slides.length)), ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [index, rotating, slides.length, nextArtworkReady]);

  function move(direction: 1 | -1) {
    const next = stepSlide(slideState, direction, slides.length);
    setWarm(true);
    setSlideState(next);
    setAnnouncement(`Featured movie: ${slides[next.index].title}`);
  }

  return (
    <section
      ref={region}
      aria-label="Featured movies"
      aria-roledescription={multiple ? "carousel" : undefined}
      data-direction={direction === 1 ? "forward" : "backward"}
      className="screening-hero relative isolate flex items-end overflow-hidden"
      // Mouse only: a finger tap on a phone shouldn't freeze the carousel.
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setHovered(false); }}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
      }}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {slides.map((slide, i) => {
          const src = backdropUrl(slide.backdropPath) ?? posterUrl(slide.posterPath, "w780");
          if (i !== 0 && !warm && i !== index) return null;
          const role = i === index ? previous === null ? "initial" : "incoming" : i === previous ? "outgoing" : "idle";
          function markReady() {
            setArtReady((current) => current[slide.href] ? current : { ...current, [slide.href]: true });
            if (i === 0) setWarm(true);
          }
          return (
            <div key={slide.href} data-active={i === index} data-slide-role={role} className="screening-hero-frame absolute inset-0">
              {src && <Image
                src={src}
                alt=""
                fill
                sizes="100vw"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                onLoad={markReady}
                onError={markReady}
                className="object-cover object-[center_34%] sm:object-[center_38%]"
              />}
            </div>
          );
        })}
      </div>
      <div className="screening-hero-shade pointer-events-none absolute inset-0 -z-10" />

      <Container className="relative pt-40 pb-8 sm:pb-12 lg:pb-14">
        <div className="min-h-[15rem] max-w-2xl sm:min-h-[17rem]">
          <h1 className="sr-only">Marquee</h1>
          <div key={active.href} data-entering={previous !== null} className="screening-feature-copy">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.19em] text-accent uppercase">
              <span className="h-px w-7 bg-accent/80" aria-hidden="true" />
              In the spotlight
            </p>
            <h2
              // pb-[0.14em]: line-clamp hides overflow, and with this tight line height the
              // tails of g/y/p fall outside the box and got clipped. The padding makes room.
              className="mt-4 line-clamp-2 pb-[0.14em] font-display text-[clamp(2.5rem,6.6vw,6.25rem)] leading-[0.96] tracking-[-0.04em] text-fg"
            >
              {active.title}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-fg/80">
              <span>Film</span>
              {active.year && <span>{active.year}</span>}
              {active.rating > 0 && (
                <span className="flex items-center gap-1.5 tabular-nums" aria-label={`TMDB rating: ${active.rating.toFixed(1)} out of 10`}>
                  <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                  {active.rating.toFixed(1)}
                </span>
              )}
            </div>
            {active.overview && (
              <p className="mt-3 line-clamp-2 max-w-[32rem] text-sm leading-relaxed text-fg/80 sm:text-base">{active.overview}</p>
            )}
          </div>
        </div>

        <p className="sr-only" role="status">{announcement}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 sm:mt-6">
          <Link href={active.href} className={buttonStyles({ className: "h-11 rounded-full px-5 font-semibold" })}>
            View details <ArrowUpRight aria-hidden="true" />
          </Link>
          {multiple && (
            <div className="flex gap-2">
              <button type="button" className={controlClass} aria-label="Previous featured movie" onClick={() => move(-1)}>
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className={controlClass} aria-label="Next featured movie" onClick={() => move(1)}>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
