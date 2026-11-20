"use client";

import { ArrowUp } from "lucide-react";

// "Back to top" that glides up instead of jumping.
// It stays a real link to #top (works before JavaScript loads); with JS we scroll
// smoothly (instantly when the OS asks for reduced motion) and move keyboard
// focus to the logo, so keyboard and screen-reader users also land at the top.

export function BackToTop({ className }: { className?: string }) {
  return (
    <a
      href="#top"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        document.querySelector<HTMLElement>('header a[aria-label="Marquee home"]')?.focus({ preventScroll: true });
      }}
    >
      Back to top <ArrowUp className="size-3.5" aria-hidden="true" />
    </a>
  );
}
