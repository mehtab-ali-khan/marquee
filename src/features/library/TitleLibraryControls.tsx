"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bookmark, Heart, Star, X } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { updateLibrary } from "./actions";

type TitleState = { watchlist: boolean; favorite: boolean; rating: number };
type Field = keyof TitleState;

const FIELDS: Field[] = ["watchlist", "favorite", "rating"];
const QUIET_MS = 350; // wait for a pause in clicking before talking to TMDB
const controlStyle = "h-11 rounded-md bg-canvas/75 aria-pressed:border-accent/50 aria-pressed:text-accent";

/**
 * Watchlist / Favorite / Rate, built to feel instant:
 *
 * 1. A click changes the button IMMEDIATELY (what you see = what you asked for).
 * 2. The request waits for a short pause in clicking ("latest wins"):
 *    double-clicking Watchlist on and off again sends nothing at all,
 *    and five quick clicks send one request with the final answer.
 * 3. Buttons are never locked: clicking again while a request is in flight
 *    queues the newest wish; the older answer is ignored. (No spinner: the
 *    instant change and the icon pop are the feedback; screen readers hear "Saving…".)
 * 4. If TMDB refuses, only that button goes back to the last saved value.
 *
 * Why not just useOptimistic? It ties the optimistic value to ONE transition,
 * so buttons had to be disabled until the save finished, and rapid clicks were lost.
 */
export function TitleLibraryControls({ type, id, initial }: {
  type: "movie" | "tv";
  id: number;
  initial: TitleState;
}) {
  // What the user sees (updated on every click).
  const [shown, setShown] = useState(initial);
  // Which buttons have a change on its way.
  const [busy, setBusy] = useState<Record<Field, boolean>>({ watchlist: false, favorite: false, rating: false });
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(0);

  // Bookkeeping that must not re-render (refs are only touched in event handlers and timers):
  const wanted = useRef(initial); // the latest wish per field
  const saved = useRef(initial); // the last value TMDB confirmed. We keep it ourselves: TMDB's
  // account_states lags a few seconds behind writes, so re-reading it could flip a button back.
  const inFlight = useRef<Record<Field, boolean>>({ watchlist: false, favorite: false, rating: false });
  const timers = useRef<Partial<Record<Field, number>>>({});

  async function flush(field: Field) {
    timers.current[field] = undefined;
    if (inFlight.current[field]) return; // the running request re-checks when it finishes

    const value = wanted.current[field];
    if (value === saved.current[field]) {
      // e.g. a double click that ended where it started: nothing to send.
      setBusy((b) => ({ ...b, [field]: false }));
      return;
    }

    inFlight.current[field] = true;
    const result = await updateLibrary(type, id, field, value).catch(() => ({ error: "Couldn’t save your change. Try again." }));
    inFlight.current[field] = false;
    if (!result.error) saved.current = { ...saved.current, [field]: value };

    // The user changed their mind while this was on its way: send the newest wish
    // (unless a quiet-period timer is already about to do that).
    if (wanted.current[field] !== value && timers.current[field] === undefined) return flush(field);
    if (wanted.current[field] !== value) return;

    if (result.error) {
      setError(result.error);
      wanted.current = { ...wanted.current, [field]: saved.current[field] };
      setShown((s) => ({ ...s, [field]: saved.current[field] }));
    }
    setBusy((b) => ({ ...b, [field]: false }));
  }

  function change<F extends Field>(field: F, value: TitleState[F]) {
    setError("");
    wanted.current = { ...wanted.current, [field]: value };
    setShown((s) => ({ ...s, [field]: value }));
    setBusy((b) => ({ ...b, [field]: true }));
    window.clearTimeout(timers.current[field]);
    timers.current[field] = window.setTimeout(() => void flush(field), QUIET_MS);
  }

  // Leaving the page within the quiet period must not lose the click: send it now.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const field of FIELDS) {
        if (pending[field] !== undefined) {
          window.clearTimeout(pending[field]);
          void flush(field);
        }
      }
    };
    // flush only reads refs and props that are fixed for this component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyBusy = FIELDS.some((f) => busy[f]);

  return (
    <>
      <div role="group" aria-label="Library actions" className="flex flex-wrap gap-2" aria-busy={anyBusy}>
        <Button variant="secondary" aria-pressed={shown.watchlist} className={controlStyle} onClick={() => change("watchlist", !shown.watchlist)}>
          <PopIcon on={shown.watchlist}>
            <Bookmark aria-hidden="true" className={shown.watchlist ? "fill-current" : undefined} />
          </PopIcon>
          Watchlist
        </Button>
        <Button variant="secondary" aria-pressed={shown.favorite} className={controlStyle} onClick={() => change("favorite", !shown.favorite)}>
          <PopIcon on={shown.favorite}>
            <Heart aria-hidden="true" className={shown.favorite ? "fill-current" : undefined} />
          </PopIcon>
          Favorite
        </Button>
        <Dialog.Root onOpenChange={(open) => { if (open) setDraft(shown.rating || 5); }}>
          <Dialog.Trigger
            aria-label={shown.rating ? `Edit your rating of ${shown.rating} out of 10` : "Rate this title"}
            className={buttonStyles({
              variant: "secondary",
              className: cn(controlStyle, shown.rating ? "border-accent/50 text-accent" : ""),
            })}
          >
            <PopIcon on={shown.rating > 0}>
              <Star aria-hidden="true" className={shown.rating ? "fill-current" : undefined} />
            </PopIcon>
            {shown.rating ? `${shown.rating} / 10` : "Rate"}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-5 shadow-2xl sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <Dialog.Title className="font-display text-2xl">Your rating</Dialog.Title>
                <Dialog.Close aria-label="Close rating" className={buttonStyles({ variant: "ghost", size: "icon" })}>
                  <X aria-hidden="true" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">Choose a score from half a point to ten.</Dialog.Description>
              <div className="mt-4 text-center text-3xl font-semibold tabular-nums text-accent">
                {draft} <span className="text-base font-normal text-fg-muted">/ 10</span>
              </div>
              <input aria-label="Your rating" aria-valuetext={`${draft} out of 10`} type="range"
                min={0.5} max={10} step={0.5} value={draft}
                onChange={(event) => setDraft(event.target.valueAsNumber)}
                className="mt-4 w-full accent-accent" />
              <div aria-hidden="true" className="flex justify-between text-sm text-fg-muted"><span>0.5</span><span>10</span></div>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                {shown.rating > 0 && (
                  <Dialog.Close asChild>
                    <Button variant="ghost" onClick={() => change("rating", 0)}>Remove rating</Button>
                  </Dialog.Close>
                )}
                <Dialog.Close asChild>
                  <Button disabled={draft === shown.rating} onClick={() => change("rating", draft)}>Save rating</Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <p role="status" className={error ? "basis-full text-sm text-danger" : "sr-only"}>
        {error || (anyBusy ? "Saving…" : "")}
      </p>
    </>
  );
}

/**
 * The icon gives a small "pop" each time its state flips: bigger when switching on.
 * initial={false}: no pop on page load, only on clicks. Skipped under reduced motion.
 */
function PopIcon({ on, children }: { on: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className="inline-flex">{children}</span>;
  return (
    <motion.span
      initial={false}
      // The keyframes differ for on/off, so every flip counts as a new target and replays.
      animate={{ scale: on ? [0.55, 1.15, 1] : [0.85, 1] }}
      transition={{ duration: on ? 0.35 : 0.2, ease: "easeOut" }}
      className="inline-flex"
    >
      {children}
    </motion.span>
  );
}
