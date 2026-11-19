import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { getPopularMovies } from "@/lib/tmdb/movies";

// TEMPORARY: a quick check that our TMDB layer works.
// Replaced by the real home page in step 6.

// An async Server Component: it awaits data directly (no useEffect).
// Caching now lives inside getPopularMovies(), so this component stays simple.
async function TmdbStatus() {
  const data = await getPopularMovies();
  const top3 = data.results.slice(0, 3).map((movie) => movie.title);

  return (
    <p className="text-sm text-fg-subtle">
      Connected to TMDB ✓ · Popular right now: {top3.join(", ")}
    </p>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl">Marquee</h1>
      <p className="text-lg text-fg-muted">What’s worth watching, tonight.</p>
      <TmdbStatus />
      <Link href="/styleguide" className={buttonStyles({ variant: "secondary" })}>
        View the design system
      </Link>
    </main>
  );
}
