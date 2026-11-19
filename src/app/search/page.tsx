import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { MediaCardSkeleton } from "@/components/media/MediaSkeletons";
import { PersonCard } from "@/components/media/PersonCard";
import { MovieCard, TvCard } from "@/components/media/TitleCards";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { search, type SearchType } from "@/lib/tmdb/search";
import { cn } from "@/lib/utils";

// /search?q=dune&type=movie&page=2
// Everything lives in the URL, so every search is a shareable link and the
// browser's back button works. No useState needed for the query or filters.

type Params = { q: string; type: SearchType; page: number };

const TYPES: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV shows" },
  { value: "person", label: "People" },
];

/** URL values are untrusted strings: turn them into safe, typed values. */
function readParams(raw: Record<string, string | string[] | undefined>): Params {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const type = first(raw.type);
  const page = Number(first(raw.page));
  return {
    q: first(raw.q).trim(),
    type: TYPES.some((t) => t.value === type) ? (type as SearchType) : "all",
    page: Number.isInteger(page) && page > 0 && page <= 500 ? page : 1, // TMDB stops at page 500
  };
}

/** Build a /search URL, leaving out defaults so links stay short. */
function searchHref({ q, type, page }: Params) {
  const sp = new URLSearchParams({ q });
  if (type !== "all") sp.set("type", type);
  if (page > 1) sp.set("page", String(page));
  return `/search?${sp}`;
}

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = readParams(await searchParams);
  return { title: q ? `“${q}”` : "Search", robots: { index: false } };
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="pb-16">
      <Container className="pt-12">
        <h1 className="text-4xl">Search</h1>
        {/* searchParams is only known when someone visits, so the part that
            reads it streams in inside Suspense (the heading above is instant). */}
        <Suspense fallback={<ResultsSkeleton />}>
          {searchParams.then((raw) => (
            <Results params={readParams(raw)} />
          ))}
        </Suspense>
      </Container>
    </main>
  );
}

async function Results({ params }: { params: Params }) {
  const { q, type, page } = params;
  const data = await search(q, type, page);
  const totalPages = Math.min(data.total_pages, 500);

  return (
    <>
      {/* next/form: a normal GET form (works even without JavaScript) that
          navigates client-side to /search?q=... when JS is available. */}
      <Form action="/search" className="relative mt-6 max-w-2xl">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-subtle" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Movies, TV shows, people…"
          aria-label="Search"
          className="h-14 w-full rounded-md border border-line bg-surface pr-4 pl-12 text-lg text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        {type !== "all" && <input type="hidden" name="type" value={type} />}
      </Form>

      {q && (
        <nav aria-label="Filter results" className="mt-6 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Link
              key={t.value}
              href={searchHref({ q, type: t.value, page: 1 })}
              aria-current={t.value === type ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors duration-150",
                t.value === type
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line text-fg-muted hover:border-fg-subtle hover:text-fg",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      )}

      {!q ? (
        <p className="mt-10 text-fg-muted">
          Type a title or a name above. Tip: press <Kbd>⌘K</Kbd> or <Kbd>Ctrl K</Kbd> anywhere to search.
        </p>
      ) : data.results.length === 0 ? (
        <p className="mt-10 text-fg-muted">
          No results for <span className="text-fg">“{q}”</span>. Check the spelling or try another filter.
        </p>
      ) : (
        <>
          <p className="mt-8 text-sm text-fg-subtle tabular-nums">
            {data.total_results.toLocaleString("en-US")} results for <span className="text-fg">“{q}”</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.results.map((r) =>
              r.media_type === "movie" ? (
                <MovieCard key={`movie-${r.id}`} movie={r} />
              ) : r.media_type === "tv" ? (
                <TvCard key={`tv-${r.id}`} show={r} />
              ) : (
                <PersonCard
                  key={`person-${r.id}`}
                  id={r.id}
                  name={r.name}
                  role={r.known_for_department}
                  profilePath={r.profile_path}
                />
              ),
            )}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-4">
              {page > 1 && (
                <Link href={searchHref({ ...params, page: page - 1 })} className={buttonStyles({ variant: "secondary" })}>
                  <ChevronLeft /> Previous
                </Link>
              )}
              <span className="text-sm text-fg-subtle tabular-nums">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link href={searchHref({ ...params, page: page + 1 })} className={buttonStyles({ variant: "secondary" })}>
                  Next <ChevronRight />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm border border-line bg-surface px-1.5 py-0.5 font-sans text-xs text-fg">{children}</kbd>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <div className="mt-6 h-14 max-w-2xl rounded-md border border-line bg-surface" />
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
