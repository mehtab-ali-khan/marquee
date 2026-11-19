import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

// A titled, horizontally scrolling row of cards ("Trending this week").
// It doesn't know what's inside: the page passes the cards as children.
// Pure CSS scrolling, so it's a Server Component with zero JavaScript.

type MediaRailProps = {
  title: string;
  href?: string; // optional "See all" link
  children: React.ReactNode;
};

export function MediaRail({ title, href, children }: MediaRailProps) {
  return (
    <section className="py-6">
      <Container>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl">{title}</h2>
          {href && (
            <Link
              href={href}
              className="flex items-center gap-1 text-sm text-fg-muted transition-colors duration-150 hover:text-fg"
            >
              See all <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* The scrolling strip:
            - grid-flow-col + auto-cols-[...]: every child becomes a column of fixed width,
              laid out side by side (no wrapping to a new line)
            - overflow-x-auto: scroll sideways when the cards don't fit
            - snap-x / snap-start: scrolling "settles" neatly on a card edge
            - negative margin + matching padding: cards can scroll all the way to the
              screen edge while the first card still lines up with the title */}
        <div
          className={[
            "grid grid-flow-col auto-cols-[9rem] gap-4 sm:auto-cols-[10rem] lg:auto-cols-[11rem]",
            "overflow-x-auto overscroll-x-contain scrollbar-none snap-x snap-mandatory",
            "-mx-4 px-4 scroll-px-4 md:-mx-6 md:px-6 md:scroll-px-6 lg:-mx-12 lg:px-12 lg:scroll-px-12",
            "pt-1 pb-2 [&>*]:snap-start",
          ].join(" ")}
        >
          {children}
        </div>
      </Container>
    </section>
  );
}
