import { Suspense } from "react";
import { Hero } from "@/components/media/Hero";
import { HeroSkeleton, MediaRailSkeleton } from "@/components/media/MediaSkeletons";
import { MediaRail } from "@/components/media/MediaRail";
import { MovieCard, TvCard } from "@/components/media/TitleCards";
import { getNowPlayingMovies, getTopRatedMovies, getUpcomingMovies } from "@/lib/tmdb/movies";
import { getTrendingAll, getTrendingMovies } from "@/lib/tmdb/trending";
import { getPopularTv, getTopRatedTv } from "@/lib/tmdb/tv";
import type { MovieSummary, Paginated, TvSummary } from "@/lib/tmdb/types";

// ---------------------------------------------------------------------------
// Building blocks (async Server Components that fetch their own data)
// ---------------------------------------------------------------------------

async function TrendingHero() {
  const data = await getTrendingAll("day");

  // Trending "all" also contains people, who have no backdrop. Pick the
  // highest-ranked movie or show that actually has a backdrop image.
  const item = data.results.find((r) => r.media_type !== "person" && r.backdrop_path);
  if (!item || item.media_type === "person") return null;

  // Checking media_type tells TypeScript which fields exist (title vs name).
  const isMovie = item.media_type === "movie";

  return (
    <Hero
      eyebrow={`#1 trending today · ${isMovie ? "Film" : "Series"}`}
      title={isMovie ? item.title : item.name}
      overview={item.overview}
      backdropPath={item.backdrop_path}
      href={`/${item.media_type}/${item.id}`}
      year={(isMovie ? item.release_date : item.first_air_date)?.slice(0, 4)}
      rating={item.vote_average}
    />
  );
}

// One component for every movie row. `load` is the data function to call,
// e.g. getTopRatedMovies. (Passing a function is fine here: everything runs
// on the server, nothing is sent to the browser.)
async function MovieRail(props: {
  title: string;
  href?: string;
  load: () => Promise<Paginated<MovieSummary>>;
}) {
  const data = await props.load();
  return (
    <MediaRail title={props.title} href={props.href}>
      {data.results.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </MediaRail>
  );
}

async function TvRail(props: { title: string; href?: string; load: () => Promise<Paginated<TvSummary>> }) {
  const data = await props.load();
  return (
    <MediaRail title={props.title} href={props.href}>
      {data.results.map((show) => (
        <TvCard key={show.id} show={show} />
      ))}
    </MediaRail>
  );
}

// ---------------------------------------------------------------------------
// The page: a list of sections. Each one loads independently (own Suspense).
// ---------------------------------------------------------------------------

const rails = [
  { kind: "movie", title: "Trending this week", load: () => getTrendingMovies("week") },
  { kind: "tv", title: "Popular on TV", load: () => getPopularTv() },
  { kind: "movie", title: "Now in theaters", load: () => getNowPlayingMovies() },
  { kind: "movie", title: "Top rated films", load: () => getTopRatedMovies() },
  { kind: "tv", title: "Top rated series", load: () => getTopRatedTv() },
  { kind: "movie", title: "Coming soon", load: () => getUpcomingMovies() },
] as const;

export default function Home() {
  return (
    <main className="pb-12">
      <Suspense fallback={<HeroSkeleton />}>
        <TrendingHero />
      </Suspense>

      {rails.map((rail) => (
        <Suspense key={rail.title} fallback={<MediaRailSkeleton title={rail.title} />}>
          {rail.kind === "movie" ? (
            <MovieRail title={rail.title} load={rail.load} />
          ) : (
            <TvRail title={rail.title} load={rail.load} />
          )}
        </Suspense>
      ))}
    </main>
  );
}
