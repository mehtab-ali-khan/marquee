"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Heart, Star } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { posterUrl } from "@/lib/tmdb/images";
import type { getLibraryPage } from "@/lib/tmdb/library";
import { cn } from "@/lib/utils";
import { libraryQuery, readLibrarySelection, shelves, type LibrarySelection } from "./selection";

type Results = Awaited<ReturnType<typeof getLibraryPage>>;
const icons = { watchlist: Bookmark, favorite: Heart, rated: Star };
const mediaTypes = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV shows" },
] as const;
const emptyMessages = {
  watchlist: "Add a title to your watchlist to save it for later.",
  favorite: "Mark a title as a favorite to keep it here.",
  rated: "Rate a title to see it here.",
};

export function LibraryView({ initialSelection, initialResults }: {
  initialSelection: LibrarySelection;
  initialResults: Results;
}) {
  const params = useSearchParams();
  const selection = readLibrarySelection({
    tab: params.get("tab"),
    type: params.get("type"),
    page: params.get("page"),
  });
  const query = libraryQuery(selection);
  const [pages, setPages] = useState<Record<string, Results>>({});
  const [failure, setFailure] = useState<{ query: string; status: number }>();
  const [retry, setRetry] = useState(0);
  const results = pages[query] ?? (query === libraryQuery(initialSelection) ? initialResults : undefined);
  const error = failure?.query === query ? failure.status : undefined;
  const Icon = icons[selection.tab];

  useEffect(() => {
    if (results || error) return;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`/api/library?${query}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) {
          if (!controller.signal.aborted) setFailure({ query, status: response.status });
          return;
        }
        const data: Results = await response.json();
        if (!controller.signal.aborted) setPages((current) => ({ ...current, [query]: data }));
      } catch {
        if (!controller.signal.aborted) setFailure({ query, status: 502 });
      }
    }

    void load();
    return () => controller.abort();
  }, [query, results, error, retry]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, target: LibrarySelection) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    const nextQuery = libraryQuery(target);
    if (nextQuery === query) return;
    setFailure(undefined);
    window.history.pushState(null, "", `/library?${nextQuery}`);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-3 py-2 sm:px-5">
        <nav aria-label="Library sections" className="flex flex-wrap gap-1">
          {shelves.map(({ value, label }) => {
            const active = selection.tab === value;
            const target = { ...selection, tab: value, page: 1 };
            const ShelfIcon = icons[value];
            return (
              <a key={value} href={`/library?${libraryQuery(target)}`} onClick={(event) => navigate(event, target)}
                aria-current={active ? "page" : undefined}
                className={cn("inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium sm:px-3",
                  active ? "bg-accent/10 text-accent" : "text-fg-muted hover:bg-raised hover:text-fg")}>
                <ShelfIcon aria-hidden="true" className="size-4" />
                {label}
              </a>
            );
          })}
        </nav>
        <nav aria-label="Media type" className="flex gap-1 rounded-md border border-line bg-canvas/60 p-1">
          {mediaTypes.map(({ value, label }) => {
            const active = selection.type === value;
            const target = { ...selection, type: value, page: 1 };
            return (
              <a key={value} href={`/library?${libraryQuery(target)}`} onClick={(event) => navigate(event, target)}
                aria-current={active ? "page" : undefined}
                className={cn("rounded-sm px-3 py-1.5 text-sm", active ? "bg-raised text-fg" : "text-fg-muted hover:text-fg")}>
                {label}
              </a>
            );
          })}
        </nav>
      </div>
      <p role="status" className="sr-only">
        {results ? `${results.cards.length} titles on this page` : error ? "Library unavailable" : "Loading titles"}
      </p>
      <section aria-label={shelves.find(({ value }) => value === selection.tab)?.label}
        aria-busy={!results && !error} className="min-h-64 p-3 sm:p-5">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p>{error === 401 ? "Your session expired." : "Couldn’t load this list."}</p>
            {error === 401 ? (
              <Link href={`/login?next=${encodeURIComponent(`/library?${query}`)}`} className={buttonStyles()}>Sign in</Link>
            ) : (
              <Button variant="secondary" onClick={() => { setFailure(undefined); setRetry(retry + 1); }}>Try again</Button>
            )}
          </div>
        ) : !results ? (
          <div aria-hidden="true" className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 rounded-md" />)}
          </div>
        ) : results.cards.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="rounded-full border border-line bg-raised p-4">
              <Icon aria-hidden="true" className="size-5 text-accent" />
            </span>
            <h2 className="text-xl">No {selection.type === "movie" ? "movies" : "TV shows"} here yet</h2>
            <p className="text-sm text-fg-muted">{emptyMessages[selection.tab]}</p>
            <Link href={`/discover?type=${selection.type}`} className={buttonStyles({ variant: "secondary", className: "mt-1" })}>
              Browse titles
            </Link>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {results.cards.map(({ key, title, href, posterPath, year, userRating }) => {
              const image = posterUrl(posterPath, "w154");
              return (
                <li key={key} className="min-w-0">
                  <Link href={href} prefetch={false}
                    className="group flex min-h-20 items-center gap-3 rounded-md border border-line bg-canvas/60 p-2 sm:gap-4">
                    <span className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-sm bg-raised">
                      {image && <Image src={image} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold group-hover:text-accent">{title}</span>
                      {year && <span className="text-sm text-fg-muted">{year}</span>}
                    </span>
                    {selection.tab === "rated" && typeof userRating === "number" && (
                      <span className="shrink-0 text-sm font-medium text-accent" aria-label={`Your rating ${userRating} out of 10`}>
                        {userRating} / 10
                      </span>
                    )}
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-fg-muted group-hover:text-accent" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {results && (results.totalPages > 1 || selection.page > 1) && (
          <nav aria-label="Library pages" className="mt-5 flex flex-wrap items-center gap-3">
            {selection.page > 1 && (
              <a href={`/library?${libraryQuery({ ...selection, page: selection.page - 1 })}`}
                onClick={(event) => navigate(event, { ...selection, page: selection.page - 1 })}
                className={buttonStyles({ variant: "secondary", size: "sm" })}><ArrowLeft /> Previous</a>
            )}
            <span className="text-sm text-fg-muted">Page {selection.page} of {Math.max(results.totalPages, 1)}</span>
            {selection.page < results.totalPages && (
              <a href={`/library?${libraryQuery({ ...selection, page: selection.page + 1 })}`}
                onClick={(event) => navigate(event, { ...selection, page: selection.page + 1 })}
                className={buttonStyles({ variant: "secondary", size: "sm" })}>Next <ArrowRight /></a>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
