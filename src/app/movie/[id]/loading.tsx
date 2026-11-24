import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

// Shown while a movie or show page loads (the TV route re-exports this).
// Same shapes as the "Festival Program": screen, title block, ticket stub.

export default function TitleLoading() {
  return (
    <main className="pb-24" aria-busy="true">
      <div className="mx-auto w-full max-w-page sm:px-6 sm:pt-6 lg:px-12">
        <Skeleton className="aspect-video w-full rounded-none sm:rounded-md lg:aspect-[2.39/1]" />
        <div className="h-10" />
      </div>
      <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-5 h-14 w-4/5 lg:h-20" />
          <Skeleton className="mt-6 h-px w-16" />
          <Skeleton className="mt-5 h-6 w-1/2" />
        </div>
        <Skeleton className="h-80 w-full rounded-lg" />
      </Container>
    </main>
  );
}
