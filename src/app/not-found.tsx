import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

// Special file name: Next shows this automatically when
//  1. a URL doesn't match any page (e.g. /blah), or
//  2. a page calls notFound() (e.g. /movie/999999999 doesn't exist on TMDB).
// It renders INSIDE the root layout, so the header and footer stay.

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center py-24">
      <Container className="max-w-2xl text-center">
        <p className="font-display text-5xl text-fg-subtle tabular-nums">404</p>
        <h1 className="mt-4 text-3xl">This reel is missing.</h1>
        <p className="mt-3 text-fg-muted">
          The page you’re looking for doesn’t exist, or it was moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonStyles()}>
            Back to home
          </Link>
          <Link href="/search" className={buttonStyles({ variant: "secondary" })}>
            Search titles
          </Link>
        </div>
      </Container>
    </main>
  );
}
