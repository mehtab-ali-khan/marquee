"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useOptimistic, useState, useTransition } from "react";
import { Bookmark, Heart, Star, X } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { updateLibrary } from "./actions";

type TitleState = { watchlist: boolean; favorite: boolean; rating: number };

const controlStyle = "h-11 rounded-md bg-canvas/75 aria-pressed:border-accent/50 aria-pressed:text-accent";

export function TitleLibraryControls({ type, id, initial }: {
  type: "movie" | "tv";
  id: number;
  initial: TitleState;
}) {
  const [state, setOptimistic] = useOptimistic(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(0);

  function save(field: keyof TitleState, value: boolean | number) {
    setError("");
    startTransition(async () => {
      setOptimistic({ ...state, [field]: value });
      try {
        const result = await updateLibrary(type, id, field, value);
        if (result.error) setError(result.error);
      } catch {
        setError("Couldn’t save your change. Try again.");
      }
    });
  }

  return (
    <>
      <div role="group" aria-label="Library actions" className="flex flex-wrap gap-2" aria-busy={pending}>
        <Button variant="secondary" aria-pressed={state.watchlist} disabled={pending}
          className={controlStyle} onClick={() => save("watchlist", !state.watchlist)}>
          <Bookmark aria-hidden="true" className={state.watchlist ? "fill-current" : undefined} />
          Watchlist
        </Button>
        <Button variant="secondary" aria-pressed={state.favorite} disabled={pending}
          className={controlStyle} onClick={() => save("favorite", !state.favorite)}>
          <Heart aria-hidden="true" className={state.favorite ? "fill-current" : undefined} />
          Favorite
        </Button>
        <Dialog.Root onOpenChange={(open) => { if (open) setDraft(state.rating || 5); }}>
          <Dialog.Trigger disabled={pending}
            aria-label={state.rating ? `Edit your rating of ${state.rating} out of 10` : "Rate this title"}
            className={buttonStyles({
              variant: "secondary",
              className: `${controlStyle} ${state.rating ? "border-accent/50 text-accent" : ""}`,
            })}>
            <Star aria-hidden="true" className={state.rating ? "fill-current" : undefined} />
            {state.rating ? `${state.rating} / 10` : "Rate"}
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
                {state.rating > 0 && (
                  <Dialog.Close asChild>
                    <Button variant="ghost" onClick={() => save("rating", 0)}>Remove rating</Button>
                  </Dialog.Close>
                )}
                <Dialog.Close asChild>
                  <Button disabled={draft === state.rating} onClick={() => save("rating", draft)}>Save rating</Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <p role="status" className={error ? "basis-full text-sm text-danger" : "sr-only"}>
        {error || (pending ? "Saving…" : "")}
      </p>
    </>
  );
}
