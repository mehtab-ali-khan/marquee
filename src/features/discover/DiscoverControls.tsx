"use client";

import { createContext, use, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import {
  DECADE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  decadeLabel,
  toDiscoverQuery,
  type DiscoverFilters,
} from "@/lib/tmdb/discover-params";
import type { Genre } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

// The Discover "control deck": every filter is a one-tap chip or tab.
//
// How it stays fast:
// - Every control is a real <Link> to the filtered URL (works without JS, can be
//   opened in a new tab). With JS we intercept the click and navigate in a transition.
// - useOptimistic: the chip lights up the moment you tap it, before the server answers.
// - While the new results load, the grid below dims (PendingArea) instead of
//   being replaced by a skeleton, so the page never jumps.

const DEFAULTS: DiscoverFilters = { type: "movie", genre: null, decade: null, rating: null, sort: "popular" };

const href = (filters: DiscoverFilters) => {
  const query = toDiscoverQuery(filters);
  return query ? `/discover?${query}` : "/discover";
};

type DiscoverState = { filters: DiscoverFilters; pending: boolean; go: (next: DiscoverFilters) => void };
const DiscoverContext = createContext<DiscoverState | null>(null);

function useDiscover() {
  const value = use(DiscoverContext);
  if (!value) throw new Error("Discover controls must be inside <DiscoverProvider>");
  return value;
}

export function DiscoverProvider({ filters, children }: { filters: DiscoverFilters; children: React.ReactNode }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(filters);
  const [pending, startTransition] = useTransition();

  function go(next: DiscoverFilters) {
    startTransition(() => {
      setOptimistic(next);
      router.push(href(next), { scroll: false });
    });
  }

  return <DiscoverContext value={{ filters: optimistic, pending, go }}>{children}</DiscoverContext>;
}

/** Dims the results while the next filter combination loads. */
export function PendingArea({ children }: { children: React.ReactNode }) {
  const { pending } = useDiscover();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-300", pending && "pointer-events-none opacity-40")}>
      {children}
    </div>
  );
}

/** A link to a filter combination that navigates through the shared transition. */
function FilterLink({ to, active, className, children, ...rest }: {
  to: DiscoverFilters;
  active: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  const { go } = useDiscover();
  return (
    <Link
      {...rest}
      href={href(to)}
      scroll={false}
      aria-current={active ? "true" : undefined}
      onNavigate={(event) => {
        event.preventDefault();
        if (!active) go(to);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}

export function FilterDeck({ genres, totalResults }: {
  genres: Record<DiscoverFilters["type"], Genre[]>;
  totalResults: number;
}) {
  const { filters, pending } = useDiscover();
  // Genre ids differ between movies and TV, so switching type clears the genre.
  const typeOptions = [
    { label: "Films", to: { ...filters, type: "movie" as const, genre: filters.type === "movie" ? filters.genre : null } },
    { label: "Series", to: { ...filters, type: "tv" as const, genre: filters.type === "tv" ? filters.genre : null } },
  ];
  const isFiltered = toDiscoverQuery({ ...filters, type: "movie" }) !== "";

  return (
    <div className="mt-12">
      <div className="rounded-lg border border-line bg-surface/50">
        {/* Row 1: what to show, and in which order. */}
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <PillTabs
            label="Show"
            activeIndex={filters.type === "movie" ? 0 : 1}
            items={typeOptions.map((o) => ({ label: o.label, to: o.to }))}
          />
          <PillTabs
            label="Sort by"
            activeIndex={SORT_OPTIONS.findIndex((o) => o.value === filters.sort)}
            items={SORT_OPTIONS.map((o) => ({ label: o.label, to: { ...filters, sort: o.value } }))}
          />
        </div>

        {/* Row 2: genre chips (scroll sideways on small screens). */}
        <ChipRow label="Genre">
          <Chip to={{ ...filters, genre: null }} active={filters.genre === null}>All</Chip>
          {genres[filters.type].map((g) => (
            <Chip key={g.id} to={{ ...filters, genre: g.id }} active={filters.genre === g.id}>
              {g.name}
            </Chip>
          ))}
        </ChipRow>

        {/* Row 3: era and minimum rating, side by side on wide screens. */}
        <div className="grid border-t border-line lg:grid-cols-[minmax(0,1fr)_auto]">
          <ChipRow label="Era">
            <Chip to={{ ...filters, decade: null }} active={filters.decade === null}>Any time</Chip>
            {DECADE_OPTIONS.map((d) => (
              <Chip key={d} to={{ ...filters, decade: d }} active={filters.decade === d}>
                {decadeLabel(d)}
              </Chip>
            ))}
          </ChipRow>
          <ChipRow label="Rating" className="border-t border-line lg:border-t-0 lg:border-l">
            <Chip to={{ ...filters, rating: null }} active={filters.rating === null}>Any</Chip>
            {RATING_OPTIONS.map((r) => (
              <Chip key={r} to={{ ...filters, rating: r }} active={filters.rating === r}>
                {r}+ ★
              </Chip>
            ))}
          </ChipRow>
        </div>
      </div>

      {/* The program line: the current selection read back as a sentence. */}
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line pb-4" aria-live="polite">
        <p className="text-fg-muted">
          <span className={cn("font-display text-2xl text-fg tabular-nums transition-opacity", pending && "opacity-40")}>
            {pending ? "…" : totalResults >= 10_000 ? "10,000+" : totalResults.toLocaleString("en-US")}
          </span>{" "}
          <Summary filters={filters} genres={genres[filters.type]} />
        </p>
        {isFiltered && (
          <FilterLink
            to={{ ...DEFAULTS, type: filters.type }}
            active={false}
            className="inline-flex items-center gap-1.5 text-sm text-fg-subtle transition-colors hover:text-accent"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" /> Clear filters
          </FilterLink>
        )}
      </div>
    </div>
  );
}

/** "drama films from the 1990s, rated 7+, highest rated first" */
function Summary({ filters, genres }: { filters: DiscoverFilters; genres: Genre[] }) {
  const genre = genres.find((g) => g.id === filters.genre)?.name;
  const order = {
    popular: "most popular first",
    top: "highest rated first",
    newest: "newest first",
    az: "A to Z",
  }[filters.sort];
  const em = (text: string) => <span className="text-fg">{text}</span>;

  return (
    <>
      {genre && <>{em(genre.toLowerCase())} </>}
      {filters.type === "tv" ? "series" : "films"}
      {filters.decade && <> {filters.decade === 1960 ? "from " : "from the "}{em(filters.decade === 1960 ? "before 1970" : decadeLabel(filters.decade))}</>}
      {filters.rating && <>, rated {em(`${filters.rating}+`)}</>}
      {" · "}
      {order}
    </>
  );
}

function ChipRow({ label, className, children }: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3 px-3 py-3 sm:px-4", className)} role="group" aria-label={label}>
      <span className="w-14 shrink-0 text-[0.68rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">{label}</span>
      {/* Fades the chips out at the right edge so it's obvious the row scrolls. */}
      <div ref={revealActiveChip} className="relative -my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 pr-6 scrollbar-none [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)]">
        {children}
      </div>
    </div>
  );
}

/** On first render, scroll a row sideways (never the page) so its selected chip is visible. */
function revealActiveChip(row: HTMLDivElement | null) {
  const chip = row?.querySelector<HTMLElement>("[aria-current]");
  if (!row || !chip) return;
  const overflow = chip.offsetLeft + chip.offsetWidth - (row.scrollLeft + row.clientWidth) + 32;
  if (overflow > 0) row.scrollLeft += overflow;
}

function Chip({ to, active, children }: { to: DiscoverFilters; active: boolean; children: React.ReactNode }) {
  return (
    <FilterLink
      to={to}
      active={active}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-[background-color,border-color,color,transform] duration-200 active:scale-95",
        active
          ? "border-accent/60 bg-accent/10 text-accent"
          : "border-line text-fg-muted hover:border-fg-subtle hover:text-fg",
      )}
    >
      {children}
    </FilterLink>
  );
}

/** Tabs with the same sliding brass pill as the main nav, driven by the optimistic filters. */
function PillTabs({ label, items, activeIndex }: {
  label: string;
  items: { label: string; to: DiscoverFilters }[];
  activeIndex: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const indicator = hovered ?? activeIndex;

  return (
    <nav aria-label={label} className="max-w-full overflow-x-auto scrollbar-none">
      <ul
        className="relative isolate inline-grid min-w-max grid-flow-col auto-cols-fr items-center rounded-full border border-line bg-canvas/60 p-1"
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
          <li key={item.label}>
            <FilterLink
              to={item.to}
              active={index === activeIndex}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHovered(index);
              }}
              className={cn(
                "flex min-h-9 items-center justify-center rounded-full px-3 text-sm font-medium whitespace-nowrap transition-[color,transform] duration-200 hover:text-fg active:scale-95 sm:px-4",
                index === activeIndex ? "text-accent" : "text-fg-muted",
              )}
            >
              {item.label}
            </FilterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
