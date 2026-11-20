import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

const columns = [
  {
    title: "Explore",
    links: [{ href: "/", label: "Home" }, { href: "/discover", label: "Discover" }, { href: "/search", label: "Search" }],
  },
  {
    title: "Your account",
    links: [{ href: "/library", label: "Library" }, { href: "/login", label: "Sign in" }],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface/55">
      <Container className="pt-9 pb-5 sm:pt-12">
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-[2fr_1fr_1fr] lg:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-sm" aria-label="Marquee home">
              <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" aria-hidden="true" />
              <span className="font-display text-2xl tracking-[-0.04em]">Marquee</span>
            </Link>
            <p className="mt-2 text-sm text-fg-muted">What’s worth watching, tonight.</p>
          </div>
          {columns.map(({ title, links }) => (
            <nav key={title} aria-label={`Footer · ${title}`}>
              <h2 className="mb-2 font-sans text-sm font-semibold tracking-normal">{title}</h2>
              <ul className="space-y-0.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="inline-flex min-h-8 items-center rounded-sm text-sm text-fg-muted transition-colors hover:text-accent">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="col-span-2 self-start sm:col-span-3 lg:col-span-1">
            <a href="#top" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3.5 text-sm text-fg-muted transition-colors hover:border-accent/60 hover:text-accent">
              Back to top <ArrowUp className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-start gap-2 border-t border-line pt-4 text-xs leading-relaxed text-fg-muted sm:mt-8 sm:flex-row sm:justify-between sm:gap-6">
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-sm transition-colors hover:text-accent">
            Data provided by TMDB <ArrowUpRight aria-hidden="true" className="size-3" />
          </a>
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </div>
      </Container>
    </footer>
  );
}
