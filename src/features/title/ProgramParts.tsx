import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { backdropUrl, profileUrl } from "@/lib/tmdb/images";
import type { Person, Program } from "./program";

// The building blocks of the "Festival Program" detail page.
// All Server Components: they render HTML, no JavaScript in the browser.

/** The backdrop framed like a cinema screen: wide letterbox on desktop, light spilling below. */
export function Screen({ backdropPath, title }: { backdropPath: string | null; title: string }) {
  const src = backdropUrl(backdropPath, "w1280");
  return (
    <div className="mx-auto w-full max-w-page sm:px-6 sm:pt-6 lg:px-12">
      <div className="relative aspect-video overflow-hidden bg-black sm:rounded-md lg:aspect-[2.39/1]">
        {src && (
          <Image
            src={src}
            alt={`Still from ${title}`}
            fill
            sizes="(min-width: 1440px) 1344px, 100vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover object-[center_30%]"
          />
        )}
        {/* Vignette: darker edges, like a projected image. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.55))]" aria-hidden="true" />
      </div>
      <div className="screen-glow h-10" aria-hidden="true" />
    </div>
  );
}

/** "NOW SHOWING · FILM · 2026" + big serif title + brass rule + tagline + genres. */
export function TitleBlock({ program }: { program: Program }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">{program.eyebrow.join("  ·  ")}</p>
      <h1 className="mt-4 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">{program.title}</h1>
      <div className="mt-6 h-px w-16 bg-accent" aria-hidden="true" />
      {program.tagline && <p className="mt-5 font-display text-xl text-fg-muted italic sm:text-2xl">{program.tagline}</p>}
      {program.genres.length > 0 && (
        <p className="mt-5 text-xs tracking-[0.18em] text-fg-subtle uppercase">{program.genres.join("  /  ")}</p>
      )}
      {/* The "billing block": the credits printed at the bottom of a film poster. */}
      {program.billing.length > 0 && (
        <p className="mt-10 max-w-xl border-t border-line pt-5 text-[0.72rem] leading-loose tracking-[0.16em] text-fg-subtle uppercase">
          {program.billing.map((line, i) => (
            <span key={line.label}>
              {i > 0 && <span className="mx-2 text-accent/70" aria-hidden="true">·</span>}
              {line.label} <span className="text-fg-muted">{line.names.join(", ")}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/**
 * The ticket stub: score + four facts on top, a perforated tear line, and the
 * actions below (passed in as children: trailer, watchlist, favorite, rate).
 */
export function TicketStub({ program, children }: { program: Program; children: React.ReactNode }) {
  return (
    <aside aria-label="Ticket" className="w-full">
      <div className="ticket-top rounded-t-lg border border-b-0 border-line bg-surface px-6 pt-5 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">Audience score</p>
            <p className="mt-1 flex items-baseline gap-1.5 tabular-nums">
              <Star className="size-5 -translate-y-0.5 fill-accent text-accent" aria-hidden="true" />
              <span className="font-display text-4xl leading-none text-fg">{program.rating > 0 ? program.rating.toFixed(1) : "—"}</span>
              <span className="text-sm text-fg-subtle">/ 10</span>
            </p>
          </div>
          {program.voteCount > 0 && (
            <p className="text-right text-xs text-fg-subtle tabular-nums">
              {program.voteCount.toLocaleString("en-US")}
              <br />
              ratings
            </p>
          )}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-4">
          {program.stub.map((fact) => (
            <div key={fact.label}>
              <dt className="text-[0.7rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">{fact.label}</dt>
              <dd className="mt-0.5 text-sm text-fg">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {/* The tear line: a dashed border between the notches. */}
      <div className="ticket-bottom rounded-b-lg border border-t-0 border-line bg-surface px-6 pt-5 pb-6">
        <div className="-mt-5 mb-5 border-t border-dashed border-fg-subtle/40" aria-hidden="true" />
        <div className="flex flex-col gap-3">{children}</div>
      </div>
    </aside>
  );
}

/** A numbered chapter: "02 — Credits" with a hairline, then its content. */
export function Chapter({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // first:… → the first chapter sits right under the chapter bar, which already draws a line.
    <section id={id} aria-labelledby={`${id}-title`} className="program-chapter border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 id={`${id}-title`} className="mb-6 flex items-baseline gap-3 font-sans text-xs font-semibold tracking-[0.22em] uppercase">
        <span className="text-accent tabular-nums">{String(number).padStart(2, "0")}</span>
        <span className="text-fg-subtle" aria-hidden="true">—</span>
        <span className="text-fg">{title}</span>
      </h2>
      {children}
    </section>
  );
}

/** The story, with an editorial drop cap. */
export function Story({ overview }: { overview: string }) {
  return (
    <p className="max-w-3xl text-lg leading-relaxed text-fg-muted first-letter:float-left first-letter:mt-1.5 first-letter:mr-3 first-letter:font-display first-letter:text-[4.25rem] first-letter:leading-[0.8] first-letter:text-accent">
      {overview || "No synopsis available yet."}
    </p>
  );
}

/** End-credits style: "Odysseus ··········· Matt Damon". People link to their pages. */
export function CreditsRoll({ cast, crew }: { cast: Program["cast"]; crew: Program["crew"] }) {
  return (
    <div className="space-y-12">
      {cast.length > 0 && (
        <div>
          <h3 className="mb-4 font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">Starring</h3>
          <Headshots cast={cast} />
        </div>
      )}
      {crew.length > 0 && (
        <div>
          <h3 className="mb-4 font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">Crew</h3>
          <dl className="grid gap-x-12 gap-y-3 md:grid-cols-2">
            {crew.map((group) => (
              <CreditLine key={group.role} label={group.role} people={group.people} />
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

/**
 * Cast as a strip of program-style headshots: black and white, turning to
 * color on hover or keyboard focus. Each one opens the person's page.
 * Scrolls sideways (swipe / trackpad) when there are more than fit.
 */
function Headshots({ cast }: { cast: Program["cast"] }) {
  return (
    // scroll-px-*: snap cards to the page gutter, not to the row's outer edge (which cut the first one off).
    <ul className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 scrollbar-none md:-mx-6 md:scroll-px-6 md:px-6 lg:-mx-12 lg:scroll-px-12 lg:px-12">
      {cast.map((person) => {
        const photo = profileUrl(person.profilePath, "w185");
        return (
          <li key={`${person.id}-${person.character}`} className="w-32 shrink-0 snap-start sm:w-36">
            <Link href={`/person/${person.id}`} className="group block rounded-md">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-line bg-raised">
                {photo ? (
                  <Image
                    src={photo}
                    alt={`Photo of ${person.name}`}
                    fill
                    sizes="144px"
                    className="object-cover grayscale transition-[filter,transform] duration-500 ease-out-soft group-hover:scale-[1.04] group-hover:grayscale-0 group-focus-visible:grayscale-0"
                  />
                ) : (
                  <span className="grid size-full place-items-center font-display text-3xl text-fg-subtle" aria-hidden="true">
                    {person.name.charAt(0)}
                  </span>
                )}
              </div>
              <p className="mt-2.5 truncate text-sm font-medium text-fg transition-colors duration-150 group-hover:text-accent">
                {person.name}
              </p>
              {person.character && <p className="truncate text-xs text-fg-subtle">{person.character}</p>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CreditLine({ label, people }: { label: string; people: Person[] }) {
  return (
    // min-w-0 (here and on <dd>): flex/grid items never shrink below their text by
    // default, so long names pushed the page sideways on phones instead of truncating.
    <div className="flex min-w-0 items-baseline gap-2 text-sm">
      <dt className="max-w-[55%] shrink-0 truncate text-fg-muted">{label}</dt>
      {/* The dotted "leader" between the role and the name, like printed credits. */}
      <span className="min-w-6 flex-1 -translate-y-1 border-b border-dotted border-fg-subtle/50" aria-hidden="true" />
      <dd className="min-w-0 truncate text-right text-fg">
        {people.map((p, i) => (
          <span key={p.id}>
            {i > 0 && ", "}
            <Link href={`/person/${p.id}`} className="underline-offset-4 transition-colors duration-150 hover:text-accent hover:underline">
              {p.name}
            </Link>
          </span>
        ))}
      </dd>
    </div>
  );
}

/** The fine-ruled spec sheet: label / value rows in two columns. */
export function SpecSheet({ specs }: { specs: Program["specs"] }) {
  return (
    <dl className="grid border-t border-line sm:grid-cols-2 sm:gap-x-12">
      {specs.map((spec) => (
        <div key={spec.label} className="flex items-baseline justify-between gap-6 border-b border-line py-3">
          <dt className="text-[0.7rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">{spec.label}</dt>
          <dd className="text-right text-sm text-fg">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
