import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

// The footer as the program's CLOSING CREDITS (same visual language as the
// detail pages): a closing line, the site's links as an end-credits roll with
// dotted leaders, and a final title card with the giant wordmark.

type Credit = { role: string; names: { label: string; href: string; external?: boolean }[] };

const credits: Credit[] = [
  {
    role: "Browse",
    names: [
      { label: "Home", href: "/" },
      { label: "Discover", href: "/discover" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    role: "Your library",
    names: [
      { label: "Watchlist", href: "/library?tab=watchlist" },
      { label: "Favorites", href: "/library?tab=favorite" },
      { label: "Rated", href: "/library?tab=rated" },
    ],
  },
  { role: "Data", names: [{ label: "The Movie Database", href: "https://www.themoviedb.org", external: true }] },
  { role: "Availability", names: [{ label: "JustWatch", href: "https://www.justwatch.com", external: true }] },
];

export function Footer() {
  return (
    <footer className="mt-auto overflow-hidden border-t border-line bg-surface/40">
      <Container className="pt-14 sm:pt-20">
        {/* 1. The closing line */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">The end</p>
            <p className="mt-4 max-w-xl font-display text-4xl leading-[1.05] sm:text-5xl">
              That’s a wrap. <span className="text-fg-muted italic">What’s next?</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/discover" className={buttonStyles({ size: "lg", className: "rounded-full" })}>
              Discover something new <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/search" className={buttonStyles({ variant: "secondary", size: "lg", className: "rounded-full" })}>
              Search
            </Link>
          </div>
        </div>

        {/* 2. End credits */}
        <dl className="mt-14 grid gap-x-16 gap-y-3 border-t border-line pt-8 md:grid-cols-2">
          {credits.map((credit) => (
            <div key={credit.role} className="flex items-baseline gap-2 text-sm">
              <dt className="shrink-0 text-[0.7rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">{credit.role}</dt>
              <span className="min-w-6 flex-1 -translate-y-1 border-b border-dotted border-fg-subtle/40" aria-hidden="true" />
              <dd className="text-right">
                {credit.names.map((name, i) => (
                  <span key={name.label}>
                    {i > 0 && <span className="text-fg-subtle">, </span>}
                    {name.external ? (
                      <a
                        href={name.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-fg-muted transition-colors duration-150 hover:text-accent"
                      >
                        {name.label} <ArrowUpRight className="size-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link href={name.href} className="text-fg-muted transition-colors duration-150 hover:text-accent">
                        {name.label}
                      </Link>
                    )}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        {/* 3. The final title card */}
        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-5 text-xs leading-relaxed text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
          <a
            href="#top"
            className="inline-flex min-h-9 shrink-0 items-center gap-2 self-start rounded-full border border-line px-3.5 text-fg-muted transition-colors duration-150 hover:border-accent/60 hover:text-accent sm:self-auto"
          >
            Back to top <ArrowUp className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </Container>
      {/* Decorative: a giant, faint wordmark fading into the bottom edge. */}
      <p
        aria-hidden="true"
        className="pointer-events-none mt-6 -mb-[0.18em] text-center font-display text-[clamp(5rem,22vw,20rem)] leading-none tracking-[-0.05em] text-transparent select-none [-webkit-text-stroke:1px_rgb(228_168_83/0.22)] [mask-image:linear-gradient(to_bottom,#000_30%,transparent)]"
      >
        Marquee
      </p>
    </footer>
  );
}
