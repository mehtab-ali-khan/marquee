"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { animate, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { takeModalOrigin, type ModalOrigin } from "./modal-origin";

// The detail modal shell (Netflix's "More info" view). The content inside is
// server-rendered and passed in as children.
//
//  - Radix Dialog: Escape, backdrop click, focus trap, page scroll lock and
//    screen-reader semantics. The overlay itself scrolls (native momentum).
//  - Open:  FLIP from the card/preview rectangle to the panel's real place.
//  - Close: animate back INTO the card first, THEN router.back() (URL → "/").
//    The browser's Back button closes it too (Next unmounts the modal route).

const OPEN_SPRING = { type: "spring", stiffness: 240, damping: 30, mass: 1 } as const;
const CLOSE_EASE = [0.32, 0.72, 0, 1] as const;

/** Transform that makes the panel exactly cover `target` (panel's transform-origin is top center). */
function coverRect(panel: HTMLElement, scroller: HTMLElement, target: DOMRect) {
  // The panel's untransformed position in the viewport (offsetX ignores transforms).
  const left = panel.offsetLeft;
  const top = panel.offsetTop - scroller.scrollTop;
  const width = panel.offsetWidth;
  return {
    x: target.left + target.width / 2 - (left + width / 2),
    y: target.top - top,
    scale: target.width / width,
  };
}

export function DetailModal({ label, children }: { label: string; children: React.ReactNode }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const origin = useRef<ModalOrigin | null>(null);
  const closing = useRef(false);

  // OPEN. A *callback ref*: React calls it the moment the panel is attached to
  // the page, before the browser paints. (A useLayoutEffect would be too early:
  // Radix's Portal mounts the panel one step AFTER the first render, so the
  // panel didn't exist yet and the modal stayed invisible.)
  //
  // Next 16 doesn't unmount pages you leave: it HIDES them (React <Activity>)
  // so Back/Forward are instant. Hiding detaches this ref (panel = null) and
  // showing re-attaches it, so we reset on detach and replay the opening on
  // every attach. Otherwise, re-opening the same title would show the
  // preserved, already-faded-out modal.
  function attachPanel(panel: HTMLDivElement | null) {
    panelRef.current = panel;
    if (!panel) {
      closing.current = false;
      return;
    }
    origin.current = takeModalOrigin(); // fresh each time (null = opened some other way)
    const scroller = panel.parentElement!; // the overlay (its ref isn't attached yet: parents attach after children)

    if (backdropRef.current) animate(backdropRef.current, { opacity: [0, 1] }, { duration: 0.3 });
    if (origin.current && !reduceMotion) {
      const from = coverRect(panel, scroller, origin.current.from);
      animate(panel, { x: [from.x, 0], y: [from.y, 0], scale: [from.scale, 1] }, OPEN_SPRING);
      animate(panel, { opacity: [0, 1] }, { duration: 0.18 });
    } else {
      animate(panel, { opacity: [0, 1], y: [12, 0], scale: [0.98, 1] }, { duration: 0.28, ease: CLOSE_EASE });
    }
  }

  async function close() {
    if (closing.current) return;
    closing.current = true;
    const panel = panelRef.current;
    const scroller = scrollerRef.current;

    // Shrink back into the card if it's still on screen; otherwise just fade.
    const returnTo = origin.current?.returnTo;
    const card = returnTo?.isConnected ? returnTo.getBoundingClientRect() : null;
    const cardVisible = card && card.width > 0 && card.bottom > 0 && card.top < window.innerHeight;

    // animate() returns controls; `.finished` is a Promise that resolves when it ends.
    const steps: Promise<unknown>[] = [animate(backdropRef.current!, { opacity: 0 }, { duration: 0.3 }).finished];
    if (panel && scroller && cardVisible && !reduceMotion) {
      const to = coverRect(panel, scroller, card);
      steps.push(animate(panel, { x: to.x, y: to.y, scale: to.scale }, { duration: 0.42, ease: CLOSE_EASE }).finished);
      steps.push(animate(panel, { opacity: 0 }, { duration: 0.16, delay: 0.28 }).finished);
    } else if (panel) {
      steps.push(animate(panel, { opacity: 0, scale: 0.98 }, { duration: 0.18 }).finished);
    }
    await Promise.all(steps);
    router.back();
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        {/* The overlay is the SCROLL container: long content scrolls natively. */}
        <Dialog.Overlay ref={scrollerRef} className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
          <div ref={backdropRef} className="fixed inset-0 bg-black/75" aria-hidden="true" style={{ opacity: 0 }} />
          <Dialog.Content
            ref={attachPanel}
            aria-describedby={undefined}
            // Focus the panel itself (not the first button) so no focus ring flashes on open.
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              panelRef.current?.focus({ preventScroll: true });
            }}
            tabIndex={-1}
            style={{ opacity: 0, transformOrigin: "50% 0" }}
            className="relative mx-auto my-4 w-[min(920px,calc(100vw-1rem))] overflow-hidden rounded-xl bg-surface shadow-[0_24px_80px_-12px_rgb(0_0_0/0.9)] outline-none sm:my-8 sm:w-[min(920px,calc(100vw-2rem))]"
          >
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="absolute top-3 right-3 z-20 grid size-10 place-items-center rounded-full bg-black/65 text-fg backdrop-blur-sm transition-colors duration-150 hover:bg-black/85"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
