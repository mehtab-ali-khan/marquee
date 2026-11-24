"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { TitlePreview } from "./TitlePreview";

// The hover-preview "brain" for the home page (Netflix's mini modal).
//
//  - Hover intent: a preview opens only after the mouse RESTS on a card
//    (450ms). Sweeping across a row opens nothing.
//  - One preview at a time, rendered in a PORTAL at the end of <body>, so the
//    row's overflow can't clip it and it floats above the rows around it.
//  - Cards and the preview only report "pointer entered / left"; this layer
//    owns all timers and decides when to open, switch or close.

export type PreviewItem = {
  key: string; // "movie-550"
  type: "movie" | "tv";
  id: number;
  href: string;
  title: string;
  backdropPath: string | null;
  posterPath: string | null;
  year?: string;
  rating: number;
  /** The `sizes` the card used for its image, so the preview can reuse the cached file. */
  imageSizes: string;
};

/** The card's position on the PAGE (not the viewport), measured when the preview opens. */
export type Anchor = { left: number; top: number; width: number; height: number };

type PreviewApi = {
  hoverStart: (item: PreviewItem, element: HTMLElement) => void;
  hoverEnd: () => void;
  closeNow: () => void;
};

const PreviewContext = createContext<PreviewApi | null>(null);

export function usePreview() {
  const api = useContext(PreviewContext);
  if (!api) throw new Error("usePreview must be used inside <PreviewLayer>");
  return api;
}

const OPEN_DELAY = 450; // resting time before a preview opens
const SWITCH_DELAY = 200; // shorter when moving from one open preview to the next card
const CLOSE_DELAY = 120; // grace period to move the pointer from card to preview

// true in the browser, false during server rendering (portals need `document`).
const subscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribe, () => true, () => false);

export function PreviewLayer({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [active, setActiveState] = useState<{ item: PreviewItem; anchor: Anchor; card: HTMLElement } | null>(null);
  // On the home page the URL is "/". When a detail modal opens it becomes
  // "/movie/550" (the home page stays underneath): previews must close and stay closed.
  const pathname = usePathname();
  const onHome = pathname === "/";
  // Timers need the CURRENT value, not the one captured when they were created,
  // so we mirror the state in a ref, updated together with it (never during render).
  const activeRef = useRef(active);
  const setActive = useCallback((next: typeof active) => {
    activeRef.current = next;
    setActiveState(next);
  }, []);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  // While the trailer modal is open the preview must stay, even though the
  // pointer "left" it (the trailer covers the whole page).
  const locked = useRef(false);

  const clearTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  const closeNow = useCallback(() => {
    if (locked.current) return;
    clearTimers();
    setActive(null);
  }, [clearTimers, setActive]);

  const hoverStart = useCallback(
    (item: PreviewItem, element: HTMLElement) => {
      clearTimers();
      if (activeRef.current?.item.key === item.key) return; // already showing this one
      const delay = activeRef.current ? SWITCH_DELAY : OPEN_DELAY;
      openTimer.current = window.setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setActive({
          item,
          card: element,
          anchor: {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
          },
        });
      }, delay);
    },
    [clearTimers, setActive],
  );

  const hoverEnd = useCallback(() => {
    window.clearTimeout(openTimer.current); // left before the intent delay: never open
    if (locked.current) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setActive(null), CLOSE_DELAY);
  }, [setActive]);

  // Close on Escape, on resize (positions would be stale) and when the window loses focus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeNow();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", closeNow);
    window.addEventListener("blur", closeNow);
    return () => {
      clearTimers();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", closeNow);
      window.removeEventListener("blur", closeNow);
    };
  }, [closeNow, clearTimers]);

  const api = useMemo(
    () => ({
      // While a modal is open, hovering cards (under the dimmed backdrop) opens nothing.
      hoverStart: onHome ? hoverStart : () => {},
      hoverEnd,
      closeNow,
    }),
    [onHome, hoverStart, hoverEnd, closeNow],
  );

  return (
    <PreviewContext.Provider value={api}>
      {children}
      {isClient &&
        createPortal(
          // AnimatePresence keeps a removed preview around until its exit animation ends.
          <AnimatePresence>
            {/* Only on "/": while a detail modal is open (URL /movie/…) no preview shows. */}
            {active && onHome && (
              <TitlePreview
                key={active.item.key}
                item={active.item}
                anchor={active.anchor}
                card={active.card}
                onOpenDetails={closeNow}
                onPointerEnter={() => window.clearTimeout(closeTimer.current)}
                onPointerLeave={hoverEnd}
                onLockChange={(isLocked) => {
                  locked.current = isLocked;
                  if (!isLocked) closeNow(); // trailer closed: the pointer is elsewhere now
                }}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </PreviewContext.Provider>
  );
}
