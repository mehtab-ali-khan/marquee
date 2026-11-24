import { cn } from "@/lib/utils";

// The shared top of a "utility" page (Discover, Library): the same eyebrow,
// serif title and brass rule as the detail pages, so the whole app reads as
// one printed program instead of a set of unrelated screens.

export function PageHeader({ eyebrow, title, description, className }: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("max-w-3xl", className)}>
      <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">{eyebrow}</p>
      <h1 className="mt-4 text-4xl leading-[1.02] sm:text-6xl">{title}</h1>
      <div className="mt-6 h-px w-16 bg-accent" aria-hidden="true" />
      {description && <p className="mt-5 max-w-xl text-fg-muted sm:text-lg">{description}</p>}
    </header>
  );
}
