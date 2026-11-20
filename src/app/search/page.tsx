import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react";
import { MediaCardSkeleton } from "@/components/media/MediaSkeletons";
import { MovieCard, TvCard } from "@/components/media/TitleCards";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SegmentedLinks } from "@/components/ui/SegmentedLinks";
import { SearchBox } from "@/features/search/SearchBox";
import { profileUrl } from "@/lib/tmdb/images";
import { search, type SearchType } from "@/lib/tmdb/search";
import { getTrendingAll } from "@/lib/tmdb/trending";
import type { MultiResult, PersonSummary } from "@/lib/tmdb/types";

// /search?q=dune&type=movie&page=2
// Everything lives in the URL, so every search is a shareable link and the
// back button works. The search box updates the URL while you type.

type Params = { q: string; type: SearchType; page: number };

const TYPES: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Films" },
  { value: "tv", label: "Series" },
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
    <main className="relative isolate pb-24">
      {/* A soft brass glow behind the search box: the "spotlight". Decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(228_168_83/0.10),transparent)]" />
      <Container className="pt-12 sm:pt-16">
        <Suspense fallback={<SearchSkeleton />}>
          {searchParams.then((raw) => (
            <SearchView params={readParams(raw)} />
          ))}
        </Suspense>
      </Container>
    </main>
  );
}

function SearchView({ params }: { params: Params }) {
  const { q, type } = params;
  return (
    <>
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">Search the catalog</p>
        <h1 className="mt-4 text-4xl leading-[1.05] sm:text-6xl">
          {q ? (
            <>
              Results for <span className="text-fg-muted italic">“{q}”</span>
            </>
          ) : (
            <>
              Find your next <span className="text-fg-muted italic">screening.</span>
            </>
          )}
        </h1>
      </header>

      <div className="mx-auto mt-8 max-w-3xl">
        <SearchBox query={q} type={type} />
      </div>

      {q && (
        <SegmentedLinks
          label="Filter results"
          className="mx-auto mt-6 w-fit"
          activeIndex={TYPES.findIndex((t) => t.value === type)}
          items={TYPES.map((t) => ({ label: t.label, href: searchHref({ q, type: t.value, page: 1 }) }))}
        />
      )}

      {/* No key on purpose: while new results load, the old ones stay on screen
          (navigation is a transition) and the box shows a spinner. No flashing. */}
      <Suspense fallback={<GridSkeleton />}>{q ? <Results params={params} /> : <StartHere />}</Suspense>
    </>
  );
}

async function Results({ params }: { params: Params }) {
  const { q, type, page } = params;
  const data = await search(q, type, page);
  const totalPages = Math.min(data.total_pages, 500);

  if (data.results.length === 0) return <NoResults q={q} type={type} />;

  // On "Everything", people get their own strip instead of being mixed into the posters.
  // There, people without a photo are left out (usually obscure matches; the People tab
  // still lists them), and the strip comes first only when TMDB ranks a person on top.
  const peopleOnly = type === "person";
  const people = data.results.filter(
    (r): r is PersonSummary & { media_type: "person" } => r.media_type === "person" && (peopleOnly || Boolean(r.profile_path)),
  );
  const titles = data.results.filter((r) => r.media_type !== "person");
  const peopleFirst = peopleOnly || data.results[0]?.media_type === "person";

  const peopleSection = people.length > 0 && (
    <section aria-labelledby="people-heading">
      {peopleOnly ? <h2 id="people-heading" className="sr-only">People</h2> : <SectionLabel id="people-heading">People</SectionLabel>}
      <People people={people} wrap={peopleOnly} />
    </section>
  );

  return (
    <div className="mt-12">
      <p className="mb-6 flex items-center gap-3 border-b border-line pb-4 text-sm text-fg-subtle tabular-nums">
        <span>
          <span className="text-fg">{data.total_results.toLocaleString("en-US")}</span> {data.total_results === 1 ? "match" : "matches"}
        </span>
        {totalPages > 1 && <span className="ml-auto">Page {page} of {totalPages}</span>}
      </p>

      {peopleFirst && peopleSection}
      {titles.length > 0 && (
        <section aria-labelledby="titles-heading" className={peopleFirst ? "mt-12" : ""}>
          {type === "all" ? <SectionLabel id="titles-heading">Films &amp; series</SectionLabel> : <h2 id="titles-heading" className="sr-only">Titles</h2>}
          <TitleGrid items={titles} />
        </section>
      )}
      {!peopleFirst && people.length > 0 && <div className="mt-14">{peopleSection}</div>}

      {totalPages > 1 && <Pagination params={params} totalPages={totalPages} />}
    </div>
  );
}

/** Before typing: trending titles as one-click searches, plus what's popular this week. */
async function StartHere() {
  const trending = await getTrendingAll("week");
  const titles = trending.results.filter((r) => r.media_type !== "person");
  const name = (r: MultiResult) => (r.media_type === "movie" ? r.title : r.name);

  return (
    <div className="mt-8">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-fg-subtle uppercase">
          <TrendingUp className="size-3.5 text-accent" aria-hidden="true" /> Trending
        </span>
        {titles.slice(0, 6).map((r) => (
          <Link
            key={`${r.media_type}-${r.id}`}
            href={searchHref({ q: name(r), type: "all", page: 1 })}
            className="rounded-full border border-line px-3.5 py-1.5 text-sm text-fg-muted transition-colors duration-150 hover:border-accent/60 hover:text-fg"
          >
            {name(r)}
          </Link>
        ))}
      </div>

      <section aria-labelledby="popular-heading" className="mt-16">
        <SectionLabel id="popular-heading">Popular this week</SectionLabel>
        <TitleGrid items={titles.slice(0, 12)} />
      </section>
    </div>
  );
}

function NoResults({ q, type }: { q: string; type: SearchType }) {
  return (
    <div className="mx-auto mt-16 max-w-xl text-center">
      <p className="font-display text-3xl">Nothing on the program.</p>
      <p className="mt-3 text-fg-muted">
        We couldn’t find {type === "all" ? "anything" : TYPES.find((t) => t.value === type)?.label.toLowerCase()} matching{" "}
        <span className="text-fg">“{q}”</span>. Check the spelling, try fewer words, or look through everything.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {type !== "all" && (
          <Link href={searchHref({ q, type: "all", page: 1 })} className={buttonStyles({ className: "rounded-full" })}>
            Search everything
          </Link>
        )}
        <Link href="/discover" className={buttonStyles({ variant: "secondary", className: "rounded-full" })}>
          Browse Discover <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-5 flex items-center gap-3 font-sans text-xs font-semibold tracking-[0.22em] text-fg uppercase">
      <span className="h-px w-6 bg-accent" aria-hidden="true" />
      {children}
    </h2>
  );
}

function TitleGrid({ items }: { items: MultiResult[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((r) =>
        r.media_type === "movie" ? (
          <MovieCard key={`movie-${r.id}`} movie={r} />
        ) : r.media_type === "tv" ? (
          <TvCard key={`tv-${r.id}`} show={r} />
        ) : null,
      )}
    </div>
  );
}

/** Round headshots: a sideways strip on "Everything", a wrapping grid on "People". */
function People({ people, wrap }: { people: PersonSummary[]; wrap: boolean }) {
  return (
    <ul
      className={
        wrap
          ? "grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
          : "-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 scrollbar-none md:-mx-6 md:px-6 lg:-mx-12 lg:px-12"
      }
    >
      {people.map((person) => {
        const photo = profileUrl(person.profile_path, "w185");
        return (
          <li key={person.id} className={wrap ? "" : "w-24 shrink-0 sm:w-28"}>
            <Link href={`/person/${person.id}`} className="group block rounded-md text-center">
              <span className="relative mx-auto block aspect-square w-full overflow-hidden rounded-full border border-line bg-raised transition-[border-color] duration-200 group-hover:border-accent/70">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover grayscale transition-[filter,transform] duration-500 ease-out-soft group-hover:scale-105 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="grid size-full place-items-center font-display text-2xl text-fg-subtle">{person.name.charAt(0)}</span>
                )}
              </span>
              <span className="mt-2.5 block truncate text-sm font-medium text-fg transition-colors group-hover:text-accent">{person.name}</span>
              {person.known_for_department && (
                <span className="block truncate text-xs text-fg-subtle">{person.known_for_department}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Pagination({ params, totalPages }: { params: Params; totalPages: number }) {
  const { page } = params;
  return (
    <nav aria-label="Pages" className="mt-14 flex items-center justify-center gap-3 border-t border-line pt-8">
      {page > 1 ? (
        <Link href={searchHref({ ...params, page: page - 1 })} className={buttonStyles({ variant: "secondary", className: "rounded-full" })}>
          <ArrowLeft aria-hidden="true" /> Previous
        </Link>
      ) : (
        <span className={buttonStyles({ variant: "secondary", className: "pointer-events-none rounded-full opacity-40" })} aria-hidden="true">
          <ArrowLeft /> Previous
        </span>
      )}
      <span className="min-w-24 text-center text-sm text-fg-subtle tabular-nums">
        <span className="text-fg">{page}</span> / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={searchHref({ ...params, page: page + 1 })} className={buttonStyles({ variant: "secondary", className: "rounded-full" })}>
          Next <ArrowRight aria-hidden="true" />
        </Link>
      ) : (
        <span className={buttonStyles({ variant: "secondary", className: "pointer-events-none rounded-full opacity-40" })} aria-hidden="true">
          Next <ArrowRight />
        </span>
      )}
    </nav>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }, (_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto h-3 w-40 rounded-sm bg-surface" />
        <div className="mx-auto mt-5 h-14 w-3/4 rounded-sm bg-surface" />
      </div>
      <div className="mx-auto mt-8 h-16 max-w-3xl rounded-full border border-line bg-surface sm:h-[4.5rem]" />
      <GridSkeleton />
    </>
  );
}
