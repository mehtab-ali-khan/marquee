import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MovieLoading() {
  return (
    <main className="pb-16">
      <div className="border-b border-line bg-surface">
        <Container className="flex items-center gap-8 pt-32 pb-8 md:py-12 lg:gap-10 lg:py-16">
          <Skeleton className="hidden aspect-[2/3] w-40 shrink-0 rounded-lg md:block lg:w-48" />
          <div className="w-full max-w-xl">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-12 w-3/4 lg:h-16" />
            <Skeleton className="mt-3 h-5 w-1/2" />
            <Skeleton className="mt-5 h-7 w-44" />
            <Skeleton className="mt-6 h-11 w-56 rounded-md" />
          </div>
        </Container>
      </div>
      <Container className="mt-12">
        <Skeleton className="mb-4 h-6 w-28" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="mt-2 h-4 w-2/3 max-w-xl" />
      </Container>
    </main>
  );
}
