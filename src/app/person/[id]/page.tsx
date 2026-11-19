import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { MediaRail } from "@/components/media/MediaRail";
import { MovieCard, TvCard } from "@/components/media/TitleCards";
import { Container } from "@/components/ui/Container";
import { buildFilmography, groupByYear, knownFor, type FilmographyYear } from "@/lib/tmdb/filmography";
import { profileUrl } from "@/lib/tmdb/images";
import { getPerson } from "@/lib/tmdb/people";

// /person/17419 → Bryan Cranston. A different, "editorial" layout from the
// movie/TV pages: portrait + facts on the left, biography on the right,
// then their best-known titles and a year-by-year filmography.

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

/** "1956-03-07" → "March 7, 1956". timeZone UTC so the day can't shift by one. */
function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function PersonPage({ params }: PageProps<"/person/[id]">) {
  const { id } = await params;
  const person = await loadPerson(id);

  const photo = profileUrl(person.profile_path, "h632");
  const { cast, crew } = person.combined_credits;
  const isActor = person.known_for_department === "Acting";

  // Actors are known for what they acted in; directors/writers for their crew work.
  const famous = knownFor(isActor ? cast : crew.length > 0 ? crew : cast);
  const acting = groupByYear(buildFilmography(cast));
  const behindCamera = groupByYear(buildFilmography(crew));
  // TMDB biographies use blank lines between paragraphs.
  const bioParagraphs = person.biography.split(/\n+/).filter(Boolean);

  const facts = [
    { label: "Known for", value: person.known_for_department },
    { label: "Born", value: formatDate(person.birthday) },
    { label: "Birthplace", value: person.place_of_birth },
    { label: "Died", value: formatDate(person.deathday) },
  ].filter((fact) => fact.value);

  return (
    <main className="pb-16">
      <Container className="pt-12 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          {/* Left column: portrait + quick facts */}
          <aside>
            <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-md border border-line bg-surface md:w-full">
              {photo ? (
                <Image
                  src={photo}
                  alt={`Photo of ${person.name}`}
                  fill
                  sizes="(max-width: 768px) 12rem, 16rem"
                  loading="eager"
                  fetchPriority="high"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-fg-subtle">
                  <UserRound className="size-16" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* <dl> = "description list": the right HTML for label/value pairs. */}
            <dl className="mt-6 space-y-4 text-sm">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs font-medium tracking-[0.15em] text-fg-subtle uppercase">{fact.label}</dt>
                  <dd className="mt-1 text-fg-muted">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </aside>

          {/* Right column: name + biography */}
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl">{person.name}</h1>
            <div className="mt-6 space-y-4 leading-relaxed text-fg-muted">
              {bioParagraphs.length > 0 ? (
                bioParagraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
              ) : (
                <p>No biography available yet.</p>
              )}
            </div>
          </div>
        </div>
      </Container>

      {famous.length > 0 && (
        <div className="mt-12">
          <MediaRail title="Known for">
            {famous.map((credit) =>
              credit.media_type === "movie" ? (
                <MovieCard key={credit.credit_id} movie={credit} />
              ) : (
                <TvCard key={credit.credit_id} show={credit} />
              ),
            )}
          </MediaRail>
        </div>
      )}

      <Container className="mt-12 space-y-12">
        {/* Actors: acting first. Directors/writers: their crew work first. */}
        {isActor ? (
          <>
            <Filmography title="Acting" years={acting} />
            <Filmography title="Behind the camera" years={behindCamera} />
          </>
        ) : (
          <>
            <Filmography title="Behind the camera" years={behindCamera} />
            <Filmography title="Acting" years={acting} />
          </>
        )}
      </Container>
    </main>
  );
}

/** A year-by-year list: the year on the left, that year's titles on the right. */
function Filmography({ title, years }: { title: string; years: FilmographyYear[] }) {
  if (years.length === 0) return null;
  const count = years.reduce((sum, year) => sum + year.entries.length, 0);

  return (
    <section>
      <h2 className="mb-6 text-2xl">
        {title} <span className="font-sans text-base text-fg-subtle tabular-nums">{count}</span>
      </h2>

      <ol className="border-t border-line">
        {years.map((year) => (
          <li key={year.label} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b border-line py-4">
            <span className="pt-0.5 text-sm text-fg-subtle tabular-nums">{year.label}</span>
            <ul className="space-y-3">
              {year.entries.map((entry) => (
                <li key={entry.key}>
                  <Link
                    href={`/${entry.mediaType}/${entry.id}`}
                    className="font-medium text-fg transition-colors duration-150 hover:text-accent"
                  >
                    {entry.title}
                  </Link>
                  <span className="ml-2 text-xs text-fg-subtle">
                    {entry.mediaType === "tv" ? "TV" : "Film"}
                    {entry.episodeCount ? ` · ${entry.episodeCount} ep.` : ""}
                  </span>
                  {entry.roles.length > 0 && (
                    <p className="mt-0.5 text-sm text-fg-muted">
                      {title === "Acting" ? `as ${entry.roles.join(" / ")}` : entry.roles.join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
