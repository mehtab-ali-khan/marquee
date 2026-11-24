"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// A row of links that behaves like tabs, with the same sliding brass pill as
// the main nav: it follows the mouse, and jumps to the clicked tab right away
// (useOptimistic) instead of waiting for the server to answer.
// Each tab is a real link, so the URL stays the source of truth.

type Segment = { href: string; label: string; count?: number };

export function SegmentedLinks({ items, activeIndex, label, className, onSelect }: {
  items: Segment[];
  activeIndex: number;
  label: string;
  className?: string;
  /** Switch in the browser instead of asking the server (data already loaded). Links still work without JS. */
  onSelect?: (index: number) => void;
}) {
  const router = useRouter();
  const [destination, setDestination] = useOptimistic(activeIndex);
  const [, startTransition] = useTransition();
  const [hovered, setHovered] = useState<number | null>(null);
  const indicator = hovered ?? destination;

  return (
    <nav aria-label={label} className={cn("max-w-full overflow-x-auto scrollbar-none", className)}>
      <ul
        className="relative isolate inline-grid min-w-max grid-flow-col auto-cols-fr items-center rounded-full border border-line bg-surface/60 p-1"
        onPointerLeave={() => setHovered(null)}
      >
        <li
          aria-hidden="true"
          className="marquee-nav-indicator pointer-events-none absolute inset-y-1 left-1 -z-10 rounded-full border border-accent/40 bg-accent/10"
          data-active={indicator >= 0}
          style={{
            width: `calc((100% - 8px) / ${items.length})`,
            transform: `translateX(${Math.max(0, indicator) * 100}%)`,
          }}
        />
        {items.map((item, index) => (
          <li key={item.href}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={index === activeIndex ? "page" : undefined}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHovered(index);
              }}
              onNavigate={(event) => {
                event.preventDefault();
                if (index === activeIndex) return;
                if (onSelect) return onSelect(index);
                startTransition(() => {
                  setDestination(index);
                  router.push(item.href, { scroll: false });
                });
              }}
              className={cn(
                "flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap sm:px-5 transition-[color,transform] duration-200 hover:text-fg active:scale-95",
                index === destination ? "text-accent" : "text-fg-muted",
              )}
            >
              {item.label}
              {item.count !== undefined && <span className="text-xs text-fg-subtle tabular-nums">{item.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
