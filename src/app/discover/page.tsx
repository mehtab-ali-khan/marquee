import type { Metadata } from "next";
import { Suspense } from "react";
import { MediaCardSkeleton } from "@/components/media/MediaSkeletons";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterPanel } from "@/features/discover/FilterPanel";
import { InfiniteGrid } from "@/features/discover/InfiniteGrid";
import { discover, getGenres } from "@/lib/tmdb/discover";
import { decadeLabel, parseDiscoverParams, toDiscoverQuery } from "@/lib/tmdb/discover-params";

// /discover?type=tv&genre=18&decade=2000&rating=8&sort=top
// A "utility" layout: sticky filters on the left, a dense poster grid on the right.

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse movies and TV shows by genre, decade, rating and more.",
};

export default function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  return (
    <main className="pb-16">
      <Container className="pt-12 sm:pt-16">
        <PageHeader
          eyebrow="Discover · The full catalog"
          title={<>Something for <span className="text-fg-muted italic">every night.</span></>}
          description="Narrow the whole catalog by genre, decade and rating. Every filter is part of the link, so you can share what you find."
        />

        <Suspense fallback={<DiscoverSkeleton />}>
          {searchParams.then((raw) => (
            <DiscoverContent raw={raw} />
          ))}
        </Suspense>
      </Container>
    </main>
  );
}

async function DiscoverContent({ raw }: { raw: Record<string, string | string[] | undefined> }) {
  // The URL may say page=3, but this page always starts at page 1;
  // the grid fetches the next pages itself while you scroll.
  const { type, genre, decade, rating, sort } = parseDiscoverParams(raw);
  const filters = { type, genre, decade, rating, sort };
  const query = toDiscoverQuery(filters);

  // Both requests start at the same time, not one after the other.
  const [genres, firstPage] = await Promise.all([getGenres(filters.type), discover(filters, 1)]);

  const genreName = genres.find((g) => g.id === filters.genre)?.name;
  const summary = [
    genreName,
    filters.type === "tv" ? "TV shows" : "movies",
    filters.decade && `from the ${decadeLabel(filters.decade).toLowerCase()}`,
    filters.rating && `rated ${filters.rating}+`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {/* key={query}: when the URL changes (e.g. back button), rebuild the form
            so its dropdowns show the URL's values, not the old selection. */}
        <FilterPanel key={query} filters={filters} genres={genres} />
      </aside>

      <section aria-label="Results">
        <p className="mb-6 text-sm text-fg-subtle tabular-nums">
          {/* TMDB caps its total at ~10,000+ for broad filters, so we don't pretend to be exact. */}
          {firstPage.totalResults >= 10_000 ? "10,000+" : firstPage.totalResults.toLocaleString("en-US")}{" "}
          <span className="text-fg-muted">{summary}</span>
        </p>
        {/* key={query}: new filters = a fresh grid that starts again at page 1. */}
        <InfiniteGrid
          key={query}
          query={query}
          initialItems={firstPage.items}
          totalPages={firstPage.totalPages}
        />
      </section>
    </div>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      <div className="space-y-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-16 rounded-sm bg-surface" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
