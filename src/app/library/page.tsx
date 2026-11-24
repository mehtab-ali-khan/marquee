import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MediaCardSkeleton } from "@/components/media/MediaSkeletons";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { LibraryView } from "@/features/library/LibraryView";
import { readShelf } from "@/features/library/selection";
import { getCurrentUser, getSessionId } from "@/lib/auth/session";
import { getLibraryOverview } from "@/lib/tmdb/library";

export const metadata: Metadata = {
  title: "Your library",
  robots: { index: false },
};

export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <main className="pb-24">
      <Container className="pt-12 sm:pt-16">
        {/* Static: shows instantly while the user's lists stream in below. */}
        <PageHeader
          eyebrow="Your library"
          title={<>Saved for <span className="text-fg-muted italic">later.</span></>}
          description="Your TMDB watchlist, favorites and ratings, in one place."
          className="mb-10"
        />
        <Suspense fallback={<LibrarySkeleton />}>
          <LibraryContent searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}

async function LibraryContent({ searchParams }: Pick<PageProps<"/library">, "searchParams">) {
  const [params, user, sessionId] = await Promise.all([searchParams, getCurrentUser(), getSessionId()]);
  if (!user || !sessionId) {
    const shelf = readShelf(params.tab);
    const back = shelf === "watchlist" ? "/library" : `/library?tab=${shelf}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  // Every shelf's first page, in parallel: the tabs then switch with no loading at all.
  const overview = await getLibraryOverview({ accountId: user.id, sessionId });

  // key: a different account must never see the previous account's local state.
  return <LibraryView key={user.id} overview={overview} />;
}

function LibrarySkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-11 w-80 max-w-full rounded-full" />
      <Skeleton className="mt-14 h-3 w-24" />
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
