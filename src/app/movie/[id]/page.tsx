import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { MediaRail } from "@/components/media/MediaRail";
import { PersonCard } from "@/components/media/PersonCard";
import { MovieCard } from "@/components/media/TitleCards";
import { TrailerButton } from "@/components/media/TrailerButton";
import { WatchProviders } from "@/components/media/WatchProviders";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { getMovie } from "@/lib/tmdb/movies";
import type { Video } from "@/lib/tmdb/types";

// The folder name [id] makes this a DYNAMIC route:
//   /movie/550   → params.id = "550"
//   /movie/27205 → params.id = "27205"
// One file serves every movie, like React Router's path="/movie/:id".

/**
 * Load the movie, or show the 404 page if it doesn't exist.
 * Used by both generateMetadata and the page. getMovie() is cached,
 * so calling it twice still asks TMDB only once.
 */
async function loadMovie(idParam: string) {
  const id = Number(idParam);
  // "/movie/abc" or "/movie/-5": not a valid TMDB id, don't even ask TMDB.
  if (!Number.isInteger(id) || id <= 0) notFound();

  // getMovie returns null when TMDB has no such movie → show our 404 page.
  // Any other problem (TMDB down...) throws → error.tsx with "Try again".
  const movie = await getMovie(id);
  if (!movie) notFound();
  return movie;
}

// Sets the browser tab title and link-preview info per movie,
// e.g. "Fight Club · Marquee" with the backdrop as the preview image.
export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const { id } = await params;
  const movie = await loadMovie(id);
  const image = backdropUrl(movie.backdrop_path, "w1280");

  return {
    title: movie.title,
    description: movie.overview,
    openGraph: { title: movie.title, description: movie.overview, images: image ? [image] : [] },
  };
}

// Which country's streaming services to show. Fixed for now; it could
// later come from a user setting or the visitor's location.
const REGION = { code: "US", name: "the United States" };

/**
 * Pick the best video to show: an official YouTube trailer if there is one,
 * otherwise any YouTube trailer, otherwise a teaser. null = nothing to show.
 */
function pickTrailer(videos: Video[]) {
  const youtube = videos.filter((v) => v.site === "YouTube");
  return (
    youtube.find((v) => v.type === "Trailer" && v.official) ??
    youtube.find((v) => v.type === "Trailer") ??
    youtube.find((v) => v.type === "Teaser") ??
    null
  );
}

/** 139 → "2h 19m" */
function formatRuntime(minutes: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default async function MoviePage({ params }: PageProps<"/movie/[id]">) {
  const { id } = await params; // params is a Promise in Next 15+, so we await it
  const movie = await loadMovie(id);

  const backdrop = backdropUrl(movie.backdrop_path, "w1280");
  const poster = posterUrl(movie.poster_path, "w500");
  const year = movie.release_date?.slice(0, 4);
  const runtime = formatRuntime(movie.runtime);
  // A movie can have several directors (e.g. "Daniel Kwan, Daniel Scheinert").
  const directors = movie.credits.crew.filter((person) => person.job === "Director").map((d) => d.name);
  // Top-billed 20 actors are plenty for a row.
  const cast = movie.credits.cast.slice(0, 20);
  const trailer = pickTrailer(movie.videos.results);
  const recommendations = movie.recommendations.results;

  return (
    <main className="pb-16">
      {/* Backdrop band at the top, fading into the page. */}
      <div className="relative h-[42vh] min-h-72 overflow-hidden md:h-[55vh]">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-canvas/10" />
      </div>

      {/* Poster + info. The negative margin pulls it up over the backdrop. */}
      <Container className="relative -mt-40 md:-mt-56">
        <div className="flex flex-col gap-8 md:flex-row md:items-end">
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-md border border-line bg-surface shadow-2xl shadow-black/50 md:w-64">
            {poster && (
              <Image
                src={poster}
                alt={`Poster for ${movie.title}`}
                fill
                sizes="(max-width: 768px) 160px, 256px"
                className="object-cover"
              />
            )}
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl">{movie.title}</h1>
            {movie.tagline && <p className="mt-3 font-display text-lg text-fg-muted italic">{movie.tagline}</p>}

            {/* Meta row: year · runtime · rating */}
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted tabular-nums">
              {year && <span>{year}</span>}
              {runtime && <span aria-hidden="true">·</span>}
              {runtime && <span>{runtime}</span>}
              {movie.vote_average > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                    {movie.vote_average.toFixed(1)}
                    <span className="text-fg-subtle">({movie.vote_count.toLocaleString("en-US")} votes)</span>
                  </span>
                </>
              )}
            </p>

            {movie.genres.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <li key={genre.id}>
                    <Badge>{genre.name}</Badge>
                  </li>
                ))}
              </ul>
            )}

            {directors.length > 0 && (
              <p className="mt-5 text-sm text-fg-muted">
                Directed by <span className="text-fg">{directors.join(", ")}</span>
              </p>
            )}

            {/* A Server Component rendering a Client Component: the page stays on the
                server, only the button + modal ship JavaScript to the browser. */}
            {trailer && (
              <div className="mt-8">
                <TrailerButton youtubeKey={trailer.key} title={movie.title} />
              </div>
            )}
          </div>
        </div>

        {/* Two columns on large screens: story on the left, where to watch on the right. */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
          <section>
            <h2 className="mb-3 text-xl">Overview</h2>
            <p className="max-w-3xl leading-relaxed text-fg-muted">
              {movie.overview || "No overview available yet."}
            </p>
          </section>
          <WatchProviders region={movie["watch/providers"].results[REGION.code]} countryName={REGION.name} />
        </div>
      </Container>

      {/* The same MediaRail as the home page, this time filled with people. */}
      {cast.length > 0 && (
        <div className="mt-8">
          <MediaRail title="Cast">
            {cast.map((person) => (
              <PersonCard
                key={person.id}
                id={person.id}
                name={person.name}
                role={person.character}
                profilePath={person.profile_path}
              />
            ))}
          </MediaRail>
        </div>
      )}

      {recommendations.length > 0 && (
        <MediaRail title="More like this">
          {recommendations.map((rec) => (
            <MovieCard key={rec.id} movie={rec} />
          ))}
        </MediaRail>
      )}
    </main>
  );
}
