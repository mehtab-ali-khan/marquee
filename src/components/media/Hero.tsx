import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { backdropUrl } from "@/lib/tmdb/images";

// The big banner at the top of the home page.
// Like MediaCard, it takes simple props, so it works for a movie or a TV show.

type HeroProps = {
  eyebrow: string; // small label above the title, e.g. "#1 trending today · Film"
  title: string;
  overview: string;
  backdropPath: string | null;
  href: string;
  year?: string;
  rating?: number;
};

export function Hero({ eyebrow, title, overview, backdropPath, href, year, rating }: HeroProps) {
  const src = backdropUrl(backdropPath, "w1280");

  return (
    // relative: the image and gradients are positioned inside this box.
    // isolate: keeps the gradient layers from mixing with the rest of the page.
    <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden md:min-h-[78vh]">
      {src && (
        <Image
          src={src}
          alt=""
          fill
          sizes="100vw"
          // This is the biggest image on the page and visible immediately,
          // so load it right away with high priority (not lazily like posters).
          loading="eager"
          fetchPriority="high"
          className="-z-20 object-cover object-top"
        />
      )}

      {/* Two gradients fade the photo into the page background, so the text
          stays readable and the banner blends into the rows below. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas/90 via-canvas/30 to-transparent" />

      <Container className="pt-32 pb-12 md:pb-16">
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-accent uppercase">{eyebrow}</p>
          <h1 className="text-4xl md:text-5xl">{title}</h1>

          <p className="mt-4 flex items-center gap-3 text-sm text-fg-muted tabular-nums">
            {year && <span>{year}</span>}
            {rating ? (
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                {rating.toFixed(1)}
              </span>
            ) : null}
          </p>

          {/* line-clamp-3: long overviews are cut to 3 lines with "…" */}
          <p className="mt-4 line-clamp-3 text-base text-fg-muted">{overview}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href} className={buttonStyles({ size: "lg" })}>
              View details
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
