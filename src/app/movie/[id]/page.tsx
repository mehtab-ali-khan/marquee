import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailHeader } from "@/components/media/DetailHeader";
import { MediaRail } from "@/components/media/MediaRail";
import { PersonCard } from "@/components/media/PersonCard";
import { MovieCard } from "@/components/media/TitleCards";
import { TrailerButton } from "@/components/media/TrailerButton";
import { WatchProviders } from "@/components/media/WatchProviders";
import { Container } from "@/components/ui/Container";
import { WATCH_REGION, pickTrailer } from "@/lib/tmdb/details";
import { backdropUrl } from "@/lib/tmdb/images";
import { getMovie } from "@/lib/tmdb/movies";

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
      <DetailHeader
        title={movie.title}
        tagline={movie.tagline}
        backdropPath={movie.backdrop_path}
        posterPath={movie.poster_path}
        facts={[year, runtime]}
        rating={{ average: movie.vote_average, count: movie.vote_count }}
        genres={movie.genres}
        credit={{ label: "Directed by", names: directors }}
      >
        {/* A Server Component rendering a Client Component: the page stays on the
            server, only the button + modal ship JavaScript to the browser. */}
        {trailer && <TrailerButton youtubeKey={trailer.key} title={movie.title} />}
      </DetailHeader>

      <Container>
        {/* Two columns on large screens: story on the left, where to watch on the right. */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
          <section>
            <h2 className="mb-3 text-xl">Overview</h2>
            <p className="max-w-3xl leading-relaxed text-fg-muted">
              {movie.overview || "No overview available yet."}
            </p>
          </section>
          <WatchProviders
            region={movie["watch/providers"].results[WATCH_REGION.code]}
            countryName={WATCH_REGION.name}
          />
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
