import { MediaRailSkeleton } from "@/components/media/MediaSkeletons";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

// Shown automatically while a person page loads. Mirrors the real layout:
// portrait + facts on the left, name + biography lines on the right.

export default function PersonLoading() {
  return (
    <main className="pb-16">
      <Container className="pt-12 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          <div>
            <Skeleton className="aspect-[2/3] w-48 md:w-full" />
            <Skeleton className="mt-6 h-3 w-20" />
            <Skeleton className="mt-2 h-4 w-32" />
            <Skeleton className="mt-4 h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
          <div className="max-w-3xl">
            <Skeleton className="h-12 w-2/3 md:h-14" />
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className={i === 0 ? "mt-8 h-4 w-full" : "mt-2 h-4 w-full"} />
            ))}
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        </div>
      </Container>
      <div className="mt-12">
        <MediaRailSkeleton title="Known for" />
      </div>
    </main>
  );
}
