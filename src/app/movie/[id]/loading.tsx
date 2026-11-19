import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

// Special file name: Next shows this AUTOMATICALLY while the movie page
// is loading. It's like wrapping the whole page in <Suspense fallback={...}>,
// without writing the Suspense yourself.
// The shapes mirror the real page so nothing jumps when it arrives.

export default function MovieLoading() {
  return (
    <main className="pb-16">
      <div className="h-[42vh] min-h-72 bg-surface md:h-[55vh]" />
      <Container className="relative -mt-40 md:-mt-56">
        <div className="flex flex-col gap-8 md:flex-row md:items-end">
          <Skeleton className="aspect-[2/3] w-40 shrink-0 md:w-64" />
          <div className="w-full max-w-3xl">
            <Skeleton className="h-12 w-3/4 md:h-14" />
            <Skeleton className="mt-4 h-5 w-1/2" />
            <Skeleton className="mt-5 h-4 w-48" />
            <div className="mt-5 flex gap-2">
              <Skeleton className="h-6 w-16 rounded-sm" />
              <Skeleton className="h-6 w-20 rounded-sm" />
              <Skeleton className="h-6 w-14 rounded-sm" />
            </div>
          </div>
        </div>
        <div className="mt-10 max-w-3xl">
          <Skeleton className="mb-4 h-6 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </Container>
    </main>
  );
}
