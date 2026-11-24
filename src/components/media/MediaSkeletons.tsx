import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { MediaRail } from "./MediaRail";

// Loading placeholders. Each one copies the EXACT shape of the real
// component, so when data arrives nothing jumps around on the page.

/** Same size as MediaCard: a 2:3 poster + a title line + a meta line. */
export function MediaCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="mt-3 h-4 w-4/5" />
      <Skeleton className="mt-1.5 h-3 w-1/3" />
    </div>
  );
}

/**
 * Reuses the REAL MediaRail with skeleton cards inside, so the spacing,
 * card widths and title position are guaranteed to match.
 */
export function MediaRailSkeleton({ title }: { title: string }) {
  return (
    <MediaRail title={title}>
      {Array.from({ length: 8 }, (_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </MediaRail>
  );
}

/** Same height as Hero, with bars where the label, title and text will be. */
export function HeroSkeleton() {
  return (
    <section className="screening-hero relative flex items-end">
      <Container className="pt-28 pb-8 sm:pt-40 sm:pb-12 lg:pb-14">
        <div className="min-h-[15rem] max-w-2xl sm:min-h-[17rem]">
          <Skeleton className="mb-4 h-3 w-40" />
          <Skeleton className="h-12 w-4/5 sm:h-20" />
          <Skeleton className="mt-5 h-4 w-24" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
          <Skeleton className="h-11 w-36 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
