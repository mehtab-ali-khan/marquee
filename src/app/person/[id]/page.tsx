import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronDown, UserRound } from "lucide-react";
import { MediaCard } from "@/components/media/MediaCard";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChapterNav } from "@/features/title/ChapterNav";
import { Chapter } from "@/features/title/ProgramParts";
import { movieToCard, tvToCard } from "@/lib/tmdb/cards";
import {
  buildFilmography,
  groupByYear,
  knownFor,
  type FilmographyEntry,
  type FilmographyYear,
} from "@/lib/tmdb/filmography";
import { profileUrl } from "@/lib/tmdb/images";
import { getPerson } from "@/lib/tmdb/people";

// /person/17419 → Bryan Cranston, in the same "Festival Program" language as
// the movie/TV pages: a framed portrait, a big serif name, a ticket stub of
// facts, then numbered chapters (biography, known for, filmography).

async function loadPerson(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const person = await getPerson(id);
  if (!person) notFound();
  return person;
}

export async function generateMetadata({ params }: PageProps<"/person/[id]">): Promise<Metadata> {
  const { id } = await params;
  const person = await loadPerson(id);
  const image = profileUrl(person.profile_path, "h632");
  const description = person.biography.split("\n")[0] || `${person.name} on Marquee`;

  return {
    title: person.name,
    description,
    openGraph: { title: person.name, description, images: image ? [image] : [] },
  };
}

const DATE = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const formatDate = (date: string | null) => (date ? DATE.format(new Date(date)) : null);

/**
 * "1981–2026" from all dated credits (unreleased projects without a date are ignored).
 * Credits dated before the person was born (archive footage reused in old
 * productions, data errors) are ignored too: TMDB said Bryan Cranston was active from 1949.
 */
function yearsActive(entries: FilmographyEntry[], birthYear?: number) {
  const years = entries.map((e) => Number(e.date.slice(0, 4))).filter((y) => y > 0 && (!birthYear || y >= birthYear));
  if (years.length === 0) return null;
  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? String(first) : `${first}–${last}`;
}

export default async function PersonPage({ params }: PageProps<"/person/[id]">) {
  const { id } = await params;
  const person = await loadPerson(id);

  const photo = profileUrl(person.profile_path, "h632");
  const { cast, crew } = person.combined_credits;
  const isActor = person.known_for_department === "Acting";

  // Actors are known for what they acted in; directors/writers for their crew work.
  const famous = knownFor(isActor ? cast : crew.length > 0 ? crew : cast);
  const actingEntries = buildFilmography(cast);
  const crewEntries = buildFilmography(crew);
  const acting = groupByYear(actingEntries);
  const behindCamera = groupByYear(crewEntries);
  // TMDB biographies use blank lines between paragraphs.
  const bio = person.biography.split(/\n+/).filter(Boolean);
  const birthYear = person.birthday?.slice(0, 4);

  const stub = [
    { label: "Credits", value: String(actingEntries.length + crewEntries.length) },
    { label: "Active", value: yearsActive([...actingEntries, ...crewEntries], birthYear ? Number(birthYear) : undefined) },
    { label: "Born", value: formatDate(person.birthday) },
    { label: person.deathday ? "Died" : "Department", value: person.deathday ? formatDate(person.deathday) : person.known_for_department },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  // Chapters, in order. Actors: acting first; directors/writers: their crew work first.
  const filmChapters = [
    { id: "acting", label: "Acting", years: acting, count: actingEntries.length, roleStyle: "as" as const },
    { id: "crew", label: "Behind the camera", years: behindCamera, count: crewEntries.length, roleStyle: "job" as const },
  ].filter((c) => c.count > 0);
  if (!isActor) filmChapters.reverse();

  const chapters = [
    { id: "biography", label: "Biography" },
    ...(famous.length ? [{ id: "known-for", label: "Known for" }] : []),
    ...filmChapters.map(({ id, label }) => ({ id, label })),
  ];
  const number = (chapterId: string) => chapters.findIndex((c) => c.id === chapterId) + 1;

  return (
    <main className="pb-24">
      <Container className="grid items-start gap-10 pt-10 md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)_20rem] lg:gap-14 lg:pt-14">
        {/* A framed portrait, like a lobby card */}
        <figure className="w-44 md:w-full">
          <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-line bg-surface ring-1 ring-accent/15 ring-offset-4 ring-offset-canvas">
            {photo ? (
              <Image
                src={photo}
                alt={`Portrait of ${person.name}`}
                fill
                sizes="(min-width: 1024px) 16rem, (min-width: 768px) 14rem, 11rem"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-fg-subtle">
                <UserRound className="size-14" aria-hidden="true" />
              </div>
            )}
          </div>
        </figure>

        {/* Eyebrow, name, birthplace, "known for" billing line */}
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
            {[person.known_for_department, birthYear && `Born ${birthYear}`].filter(Boolean).join("  ·  ")}
          </p>
          <h1 className="mt-4 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">{person.name}</h1>
          <div className="mt-6 h-px w-16 bg-accent" aria-hidden="true" />
          {person.place_of_birth && (
            <p className="mt-5 font-display text-xl text-fg-muted italic">{person.place_of_birth}</p>
          )}
          {famous.length > 0 && (
            <p className="mt-10 max-w-xl border-t border-line pt-5 text-[0.72rem] leading-loose tracking-[0.16em] text-fg-subtle uppercase">
              Known for{" "}
              {famous.slice(0, 3).map((credit, i) => (
                <span key={credit.credit_id}>
                  {i > 0 && <span className="mx-2 text-accent/70" aria-hidden="true">·</span>}
                  <Link
                    href={`/${credit.media_type}/${credit.id}`}
                    className="text-fg-muted transition-colors duration-150 hover:text-accent"
                  >
                    {credit.media_type === "movie" ? credit.title : credit.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Ticket stub: facts + outbound links */}
        <aside aria-label="Facts" className="w-full md:col-span-2 lg:col-span-1">
          <div className="ticket-top rounded-t-lg border border-b-0 border-line bg-surface px-6 pt-5 pb-6">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {stub.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[0.7rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">{fact.label}</dt>
                  <dd className="mt-0.5 text-sm text-fg tabular-nums">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="ticket-bottom rounded-b-lg border border-t-0 border-line bg-surface px-6 pt-5 pb-6">
            <div className="-mt-5 mb-5 border-t border-dashed border-fg-subtle/40" aria-hidden="true" />
            <div className="flex gap-2">
              <a
                href={`https://www.themoviedb.org/person/${person.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "secondary", className: "h-10 flex-1" })}
              >
                TMDB <ArrowUpRight aria-hidden="true" />
              </a>
              {person.imdb_id && (
                <a
                  href={`https://www.imdb.com/name/${person.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: "secondary", className: "h-10 flex-1" })}
                >
                  IMDb <ArrowUpRight aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </aside>
      </Container>

      <ChapterNav className="mt-16" chapters={chapters} />

      <Container className="mt-12 space-y-16">
        <Chapter id="biography" number={number("biography")} title="Biography">
          <Biography paragraphs={bio} />
        </Chapter>

        {famous.length > 0 && (
          <Chapter id="known-for" number={number("known-for")} title="Known for">
            <ul className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
              {famous.map((credit) => {
                const { key, ...card } = credit.media_type === "movie" ? movieToCard(credit) : tvToCard(credit);
                return (
                  <li key={key}>
                    <MediaCard {...card} />
                  </li>
                );
              })}
            </ul>
          </Chapter>
        )}

        {filmChapters.map((chapter) => (
          <Chapter key={chapter.id} id={chapter.id} number={number(chapter.id)} title={`${chapter.label} · ${chapter.count}`}>
            <Filmography years={chapter.years} total={chapter.count} roleStyle={chapter.roleStyle} />
          </Chapter>
        ))}
      </Container>
    </main>
  );
}

/** Drop-cap opening; long biographies fold away behind "Read the full biography" (no JS: <details>). */
function Biography({ paragraphs }: { paragraphs: string[] }) {
  if (paragraphs.length === 0) return <p className="text-fg-muted">No biography available yet.</p>;
  const [first, ...rest] = paragraphs;
  const visible = rest.slice(0, 1);
  const folded = rest.slice(1);
  const p = "max-w-3xl leading-relaxed text-fg-muted";

  return (
    <div className="space-y-4">
      <p className={`${p} text-lg first-letter:float-left first-letter:mt-1.5 first-letter:mr-3 first-letter:font-display first-letter:text-[4.25rem] first-letter:leading-[0.8] first-letter:text-accent`}>
        {first}
      </p>
      {visible.map((text, i) => (
        <p key={i} className={p}>
          {text}
        </p>
      ))}
      {folded.length > 0 && (
        <details className="group max-w-3xl">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-hover [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Read the full biography</span>
            <span className="hidden group-open:inline">Show less</span>
            <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-4 space-y-4">
            {folded.map((text, i) => (
              <p key={i} className={p}>
                {text}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

const FIRST_BATCH = 30; // entries shown before "Show all"

/** Year-by-year, ruled like a program's index. Long lists fold after the most recent 30. */
function Filmography({ years, total, roleStyle }: { years: FilmographyYear[]; total: number; roleStyle: "as" | "job" }) {
  // Split the year groups into "shown first" and "folded", without breaking a year in two.
  const shown: FilmographyYear[] = [];
  const folded: FilmographyYear[] = [];
  let count = 0;
  for (const year of years) {
    (count < FIRST_BATCH ? shown : folded).push(year);
    count += year.entries.length;
  }

  const list = (groups: FilmographyYear[]) => (
    <ol>
      {groups.map((year) => (
        <li key={year.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 border-t border-line py-4 sm:grid-cols-[6rem_minmax(0,1fr)]">
          {/* "Upcoming" (undated projects) is too wide for the year column: print it as a small caps label instead. */}
          {/^\d+$/.test(year.label) ? (
            <span className="font-display text-xl text-fg-subtle tabular-nums sm:text-2xl">{year.label}</span>
          ) : (
            <span className="pt-1.5 text-[0.68rem] font-semibold tracking-[0.18em] text-accent uppercase">{year.label}</span>
          )}
          <ul className="space-y-3 pt-1">
            {year.entries.map((entry) => (
              <li key={entry.key} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
                <span className="min-w-0">
                  <Link href={`/${entry.mediaType}/${entry.id}`} className="font-medium text-fg transition-colors duration-150 hover:text-accent">
                    {entry.title}
                  </Link>
                  <span className="ml-2 text-[0.68rem] tracking-[0.16em] text-fg-subtle uppercase">
                    {entry.mediaType === "tv" ? "Series" : "Film"}
                    {entry.episodeCount ? ` · ${entry.episodeCount} ep.` : ""}
                  </span>
                </span>
                {entry.roles.length > 0 && (
                  <span className="text-sm text-fg-muted">
                    {roleStyle === "as" ? `as ${entry.roles.join(" / ")}` : entry.roles.join(", ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );

  return (
    <div>
      {list(shown)}
      {folded.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 border-t border-line py-4 text-sm text-accent transition-colors hover:text-accent-hover [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show all {total}</span>
            <span className="hidden group-open:inline">Show fewer</span>
            <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
          </summary>
          {list(folded)}
        </details>
      )}
    </div>
  );
}
