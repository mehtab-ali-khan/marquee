import type { Metadata } from "next";
import { Suspense } from "react";
import { MediaCardSkeleton } from "@/components/media/MediaSkeletons";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DiscoverProvider, FilterDeck, PendingArea } from "@/features/discover/DiscoverControls";
import { InfiniteGrid } from "@/features/discover/InfiniteGrid";
import { discover, getGenres } from "@/lib/tmdb/discover";
import { parseDiscoverParams, toDiscoverQuery } from "@/lib/tmdb/discover-params";

// /discover?type=tv&genre=18&decade=2000&rating=8&sort=top
// A control deck of one-tap filters on top, a full-width poster grid below.

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

  // All three requests start at the same time. Both genre lists are loaded (cached
  // for weeks) so switching Films ⇄ Series shows the right genre chips instantly.
  const [movieGenres, tvGenres, firstPage] = await Promise.all([getGenres("movie"), getGenres("tv"), discover(filters, 1)]);

  return (
    <DiscoverProvider filters={filters}>
      <FilterDeck genres={{ movie: movieGenres, tv: tvGenres }} totalResults={firstPage.totalResults} />
      <section aria-label="Results" className="mt-8">
        <PendingArea>
          {/* key={query}: new filters = a fresh grid that starts again at page 1. */}
          <InfiniteGrid key={query} query={query} initialItems={firstPage.items} totalPages={firstPage.totalPages} />
        </PendingArea>
      </section>
    </DiscoverProvider>
  );
}

function DiscoverSkeleton() {
  return (
    <>
      <div className="mt-12 h-[13.5rem] rounded-lg border border-line bg-surface/50" />
      <div className="mt-8 h-9 w-72 rounded-sm bg-surface" />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
