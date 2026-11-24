import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

// Shown while a person page loads. Same shapes as the real page:
// portrait, eyebrow + name + birthplace, ticket stub.

export default function PersonLoading() {
  return (
    <main className="pb-24" aria-busy="true">
      <Container className="grid items-start gap-10 pt-10 md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)_20rem] lg:gap-14 lg:pt-14">
        <Skeleton className="aspect-[2/3] w-44 md:w-full" />
        <div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-5 h-14 w-4/5 lg:h-20" />
          <Skeleton className="mt-6 h-px w-16" />
          <Skeleton className="mt-5 h-6 w-1/2" />
        </div>
        <Skeleton className="h-52 w-full rounded-lg md:col-span-2 lg:col-span-1" />
      </Container>
    </main>
  );
}
