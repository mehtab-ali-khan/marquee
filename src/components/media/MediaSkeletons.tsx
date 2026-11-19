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
    <section className="relative flex min-h-[70vh] items-end bg-surface md:min-h-[78vh]">
      <Container className="pt-32 pb-12 md:pb-16">
        <div className="max-w-xl">
          <Skeleton className="mb-4 h-3 w-40" />
          <Skeleton className="h-12 w-4/5 md:h-14" />
          <Skeleton className="mt-5 h-4 w-24" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-8 h-12 w-36 rounded-sm" />
        </div>
      </Container>
    </section>
  );
}
