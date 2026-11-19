"use client";

import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import {
  DECADE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  decadeLabel,
  parseDiscoverParams,
  toDiscoverQuery,
  type DiscoverFilters,
} from "@/lib/tmdb/discover-params";
import type { Genre } from "@/lib/tmdb/types";

// The filter sidebar. Filters live in the URL (shareable, back button works).
// Without JS it's a plain GET form to /discover with an "Apply" button.
// With JS, changing any dropdown navigates right away to a clean URL.

type FilterPanelProps = {
  filters: DiscoverFilters;
  genres: Genre[];
};

export function FilterPanel({ filters, genres }: FilterPanelProps) {
  const router = useRouter();

  function applyOnChange(event: React.ChangeEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    // Genre ids differ between movies and TV, so switching type clears the genre.
    if ((event.target as HTMLElement).getAttribute("name") === "type") {
      (form.elements.namedItem("genre") as HTMLSelectElement).value = "";
    }
    // A plain form submit would put EVERY field in the URL, even empty ones
    // (?type=movie&genre=&rating=...). With JS we build the clean URL instead,
    // using the same helpers as the server: ?decade=1990
    const values = new URLSearchParams();
    new FormData(form).forEach((value, key) => values.set(key, String(value)));
    const query = toDiscoverQuery(parseDiscoverParams(values));
    router.push(query ? `/discover?${query}` : "/discover", { scroll: false });
  }

  return (
    <Form action="/discover" onChange={applyOnChange} className="space-y-5">
      <Field label="Show">
        <select name="type" defaultValue={filters.type} className={selectClass}>
          <option value="movie">Movies</option>
          <option value="tv">TV shows</option>
        </select>
      </Field>

      <Field label="Sort by">
        <select name="sort" defaultValue={filters.sort} className={selectClass}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Genre">
        <select name="genre" defaultValue={filters.genre ?? ""} className={selectClass}>
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Released">
        <select name="decade" defaultValue={filters.decade ?? ""} className={selectClass}>
          <option value="">Any time</option>
          {DECADE_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {decadeLabel(d)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Rating">
        <select name="rating" defaultValue={filters.rating ?? ""} className={selectClass}>
          <option value="">Any rating</option>
          {RATING_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}+ stars
            </option>
          ))}
        </select>
      </Field>

      {/* Keyboard users / no-JS fallback. Hidden until focused. */}
      <button type="submit" className="sr-only focus:not-sr-only focus:underline">
        Apply filters
      </button>

      <Link
        href="/discover"
        className="flex items-center gap-2 text-sm text-fg-subtle transition-colors duration-150 hover:text-fg"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" /> Reset filters
      </Link>
    </Form>
  );
}

const selectClass =
  "h-10 w-full cursor-pointer rounded-sm border border-line bg-surface px-3 text-sm text-fg transition-colors duration-150 hover:border-fg-subtle focus:border-accent focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-[0.15em] text-fg-subtle uppercase">{label}</span>
      {children}
    </label>
  );
}
