"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { usePreview, type PreviewItem } from "./PreviewLayer";

// A 16:9 title card (Netflix-style). Resting the MOUSE on it opens the hover
// preview. Touch and keyboard users get a normal link to the detail page.

// How wide a card is at each screen size (matches .title-row in globals.css),
// so the browser downloads a small enough image.
export const CARD_IMAGE_SIZES = "(min-width: 1280px) 19vw, (min-width: 1024px) 23vw, (min-width: 640px) 37vw, 64vw";

export function TitleCard({ item, eager = false }: { item: Omit<PreviewItem, "imageSizes">; eager?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { hoverStart, hoverEnd } = usePreview();
  const src = backdropUrl(item.backdropPath, "w780") ?? posterUrl(item.posterPath, "w500");

  return (
    <li>
      <Link
        ref={ref}
        href={item.href}
        className="title-card group relative block aspect-video overflow-hidden rounded-md bg-surface outline-offset-4"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && ref.current) {
            hoverStart({ ...item, imageSizes: CARD_IMAGE_SIZES }, ref.current);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") hoverEnd();
        }}
      >
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes={CARD_IMAGE_SIZES}
            loading={eager ? "eager" : "lazy"}
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-fg-subtle">
            <Clapperboard className="size-6" aria-hidden="true" />
          </span>
        )}
        {/* TMDB backdrops have no title text, so we print it over a soft gradient. */}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pt-10 pb-2.5">
          <span className="line-clamp-2 font-display text-[0.95rem] leading-tight text-white sm:text-base">{item.title}</span>
        </span>
      </Link>
    </li>
  );
}
