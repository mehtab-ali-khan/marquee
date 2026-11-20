"use client";
// Client Component: it has a button that opens/closes something (interaction),
// which only the browser can do.

import * as Dialog from "@radix-ui/react-dialog";
import { Play, X } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";

// Radix Dialog gives us an ACCESSIBLE modal for free:
//  - Escape key and clicking the dark backdrop close it
//  - keyboard focus moves into the modal and can't "escape" behind it (focus trap)
//  - focus returns to the button when it closes
//  - the page behind can't scroll, and screen readers announce it as a dialog
// It has no styles of its own: we style every part with our tokens.

type TrailerButtonProps = {
  youtubeKey: string; // the video id, e.g. "BdJKm16Co6M"
  title: string; // movie title, for the dialog label
  /** "button" = "▶ Watch trailer" (detail pages); "icon" = round ▶ (hover previews). */
  variant?: "button" | "icon";
  /** Lets a parent react to the trailer opening/closing (the preview stays open meanwhile). */
  onOpenChange?: (open: boolean) => void;
};

export function TrailerButton({ youtubeKey, title, variant = "button", onOpenChange }: TrailerButtonProps) {
  return (
    // Dialog.Root keeps the open/closed state for us (like a built-in useState).
    <Dialog.Root onOpenChange={onOpenChange}>
      {variant === "icon" ? (
        <Dialog.Trigger
          aria-label={`Play trailer for ${title}`}
          title="Play trailer"
          className="grid size-10 place-items-center rounded-full bg-fg text-canvas transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          <Play className="size-4 translate-x-px fill-current" aria-hidden="true" />
        </Dialog.Trigger>
      ) : (
        <Dialog.Trigger className={buttonStyles({ className: "h-11 rounded-md px-4" })}>
          <Play className="fill-current" /> Watch trailer
        </Dialog.Trigger>
      )}

      {/* Portal: renders the modal at the end of <body>, above everything else. */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />

        <Dialog.Content
          aria-describedby={undefined} // no extra description text needed
          className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,1100px)] -translate-x-1/2 -translate-y-1/2 data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in"
        >
          {/* Screen readers read this title; sighted users don't need to see it. */}
          <Dialog.Title className="sr-only">{title}: trailer</Dialog.Title>

          {/* The close button comes BEFORE the video on purpose: when the modal opens,
              focus goes to the first focusable element. If that were the YouTube
              iframe, key presses would go to YouTube and Escape couldn't close the modal. */}
          <Dialog.Close
            aria-label="Close trailer"
            className={buttonStyles({ variant: "secondary", size: "icon", className: "absolute -top-12 right-0" })}
          >
            <X />
          </Dialog.Close>

          <div className="aspect-video overflow-hidden rounded-lg border border-line bg-black shadow-2xl">
            {/* The iframe only exists while the modal is open, so the video stops
                when you close it, and YouTube isn't loaded until you ask for it. */}
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0`}
              title={`${title}: trailer`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="size-full"
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
