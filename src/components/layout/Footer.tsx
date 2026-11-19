import Link from "next/link";
import { Container } from "@/components/ui/Container";

// The bottom of every page. A Server Component: plain links and text.

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/discover", label: "Discover" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "You",
    links: [
      { href: "/library", label: "Library" },
      { href: "/login", label: "Sign in" },
    ],
  },
];

export function Footer() {
  return (
    // mt-auto: if a page is short, push the footer to the bottom of the window.
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent" />
            <span className="font-display text-lg">Marquee</span>
          </Link>
          <p className="mt-3 text-sm text-fg-muted">What’s worth watching, tonight.</p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-3 font-sans text-xs font-medium tracking-[0.15em] text-fg-subtle uppercase">
              {column.title}
            </h2>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-fg-muted transition-colors duration-150 hover:text-fg">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      {/* TMDB attribution: required by TMDB's terms of use for using their API. */}
      <div className="border-t border-line">
        <Container className="py-6">
          <p className="text-xs text-fg-subtle">
            Movie and TV data from{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-muted underline-offset-2 hover:text-fg hover:underline"
            >
              The Movie Database (TMDB)
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </Container>
      </div>
    </footer>
  );
}
