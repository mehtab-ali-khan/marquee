"use client";

import { useEffect, useRef } from "react";

// The sideways strip of cast headshots.
// With a mouse, a photo turns from black-and-white to colour on hover (pure CSS).
// Touch screens have no hover, so there the strip itself does it: each photo
// colours in once it is (almost) fully in view while you swipe, and fades back
// to black-and-white as it slides out. It marks <li data-inview="true">, and
// the image reacts with `in-data-[inview=true]:grayscale-0`.

export function HeadshotStrip({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const strip = ref.current;
    if (!strip || !window.matchMedia("(hover: none)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).dataset.inview = String(entry.intersectionRatio >= 0.9);
        }
      },
      // root: the strip, so "in view" means "not cut off at the strip's edges".
      { root: strip, threshold: [0, 0.9] },
    );
    for (const item of strip.children) observer.observe(item);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
