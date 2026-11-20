import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { Hero, type FeaturedTitle } from "@/components/media/Hero";
import { HeroSkeleton } from "@/components/media/MediaSkeletons";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ScreeningCard, ScreeningCardSkeleton } from "@/features/home/ScreeningCard";
import { ScreeningRail } from "@/features/home/ScreeningRail";
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
  { title: "Trending this week", format: "still", load: () => getTrendingMovies("week") },
  { title: "Now in theaters", format: "poster", load: () => getNowPlayingMovies() },
  { title: "Popular on TV", format: "still", load: () => getPopularTv() },
  { title: "Top rated films", format: "poster", load: () => getTopRatedMovies() },
  { title: "Top rated series", format: "poster", load: () => getTopRatedTv() },
  { title: "Coming soon", format: "poster", load: () => getUpcomingMovies() },
] as const;

type HomeRail = {
  title: string;
  format: "still" | "poster";
  load: () => Promise<Paginated<MovieSummary> | Paginated<TvSummary>>;
};

async function HomeTitles({ rail }: { rail: HomeRail }) {
  const { results } = await rail.load();
  if (!results.length) return null;

  return (
    <ScreeningRail title={rail.title} format={rail.format}>
      {results.map((item) => {
        const movie = "title" in item;
        return (
          <ScreeningCard
            key={item.id}
            format={rail.format}
            title={movie ? item.title : item.name}
            href={`/${movie ? "movie" : "tv"}/${item.id}`}
            year={(movie ? item.release_date : item.first_air_date)?.slice(0, 4)}
            rating={item.vote_average}
            overview={item.overview}
            posterPath={item.poster_path}
            backdropPath={item.backdrop_path}
          />
        );
      })}
    </ScreeningRail>
  );
}

function HomeRailSkeleton({ rail }: { rail: HomeRail }) {
  return (
    <ScreeningRail title={rail.title} format={rail.format} loading>
      {Array.from({ length: rail.format === "still" ? 4 : 8 }, (_, index) => (
        <ScreeningCardSkeleton key={index} />
      ))}
    </ScreeningRail>
  );
}

export default function Home() {
  return (
    <main className="screening-home pb-12 sm:pb-16">
      <Suspense fallback={<HeroSkeleton />}>
        <TrendingHero />
      </Suspense>

      <div className="space-y-2 pb-3 sm:space-y-4 sm:pb-8">
        {rails.map((rail) => (
          <Suspense key={rail.title} fallback={<HomeRailSkeleton rail={rail} />}>
            <HomeTitles rail={rail} />
          </Suspense>
        ))}
      </div>
    </main>
  );
}
