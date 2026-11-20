import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { Hero, type FeaturedTitle } from "@/components/media/Hero";
import { HeroSkeleton } from "@/components/media/MediaSkeletons";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PreviewLayer } from "@/features/home/PreviewLayer";
import { TitleCard } from "@/features/home/TitleCard";
import { TitleRow, TitleRowSkeleton } from "@/features/home/TitleRow";
import { getNowPlayingMovies, getTopRatedMovies, getUpcomingMovies } from "@/lib/tmdb/movies";
import { getTrendingMovies } from "@/lib/tmdb/trending";
import { getPopularTv, getTopRatedTv } from "@/lib/tmdb/tv";
import type { MovieSummary, Paginated, TvSummary } from "@/lib/tmdb/types";

async function TrendingHero() {
  const { results } = await getTrendingMovies("day");
  const slides: FeaturedTitle[] = results.slice(0, 5).map((movie) => ({
    href: `/movie/${movie.id}`,
    title: movie.title,
    overview: movie.overview,
    backdropPath: movie.backdrop_path,
    posterPath: movie.poster_path,
    year: movie.release_date?.slice(0, 4),
    rating: movie.vote_average,
  }));

  const [first, ...rest] = slides;
  if (first) return <Hero slides={[first, ...rest]} />;

  return (
    <section className="screening-hero flex items-end">
      <Container className="pb-14">
        <h1 className="max-w-xl text-4xl sm:text-5xl">Find your next film.</h1>
        <Link href="/discover" className={buttonStyles({ className: "mt-5 h-11 rounded-full" })}>
          Explore the catalog <ArrowUpRight aria-hidden="true" />
        </Link>
      </Container>
    </section>
  );
}

const rails = [
  { title: "Trending this week", load: () => getTrendingMovies("week") },
  { title: "Now in theaters", load: () => getNowPlayingMovies() },
  { title: "Popular on TV", load: () => getPopularTv() },
  { title: "Top rated films", load: () => getTopRatedMovies() },
  { title: "Top rated series", load: () => getTopRatedTv() },
  { title: "Coming soon", load: () => getUpcomingMovies() },
];

type HomeRail = {
  title: string;
  load: () => Promise<Paginated<MovieSummary> | Paginated<TvSummary>>;
};

// Server Component: fetches its row (cached) and turns TMDB objects into the
// small, flat props the client cards need.
async function HomeTitles({ rail, eager }: { rail: HomeRail; eager: boolean }) {
  const { results } = await rail.load();
  if (!results.length) return null;

  return (
    <TitleRow title={rail.title}>
      {results.map((item, index) => {
        const movie = "title" in item;
        const type = movie ? "movie" : "tv";
        return (
          <TitleCard
            key={item.id}
            eager={eager && index < 5}
            item={{
              key: `${type}-${item.id}`,
              type,
              id: item.id,
              href: `/${type}/${item.id}`,
              title: movie ? item.title : item.name,
              backdropPath: item.backdrop_path,
              posterPath: item.poster_path,
              year: (movie ? item.release_date : item.first_air_date)?.slice(0, 4),
              rating: item.vote_average,
            }}
          />
        );
      })}
    </TitleRow>
  );
}

export default function Home() {
  return (
    <main className="screening-home pb-12 sm:pb-16">
      <Suspense fallback={<HeroSkeleton />}>
        <TrendingHero />
      </Suspense>

      {/* PreviewLayer: the hover-preview "brain" + portal for every row inside it. */}
      <PreviewLayer>
        <div className="pb-3 sm:pb-8">
          {rails.map((rail, index) => (
            <Suspense key={rail.title} fallback={<TitleRowSkeleton title={rail.title} />}>
              <HomeTitles rail={rail} eager={index === 0} />
            </Suspense>
          ))}
        </div>
      </PreviewLayer>
    </main>
  );
}
