import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { LibraryView } from "@/features/library/LibraryView";
import { libraryQuery, readLibrarySelection } from "@/features/library/selection";
import { getCurrentUser, getSessionId } from "@/lib/auth/session";
import { getLibraryPage } from "@/lib/tmdb/library";

export const metadata: Metadata = {
  title: "Your library",
  robots: { index: false },
};

async function LibraryContent({ searchParams }: Pick<PageProps<"/library">, "searchParams">) {
  const [params, user, sessionId] = await Promise.all([searchParams, getCurrentUser(), getSessionId()]);
  const selection = readLibrarySelection(params);
  const href = `/library?${libraryQuery(selection)}`;
  if (!user || !sessionId) redirect(`/login?next=${encodeURIComponent(href)}`);

  const results = await getLibraryPage(
    { accountId: user.id, sessionId },
    selection.tab,
    selection.type,
    selection.page,
  );
  if (selection.page > 1 && selection.page > results.totalPages) {
    redirect(`/library?${libraryQuery({ ...selection, page: Math.max(results.totalPages, 1) })}`);
  }

  return <LibraryView key={`${user.id}:${href}`} initialSelection={selection} initialResults={results} />;
}

export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <main>
      <Container className="max-w-6xl py-8 sm:py-12">
        <h1 className="mb-6 text-3xl sm:mb-8 sm:text-4xl">Your library</h1>
        <Suspense fallback={<Skeleton className="h-52 w-full rounded-lg" />}>
          <LibraryContent searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}
