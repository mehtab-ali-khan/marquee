import Image from "next/image";
import { cn } from "@/lib/utils";

// The Marquee logo: the exact brass ticket from the logo sheet
// (public/brand/marquee-symbol.png, transparent background, made by
// scripts/brand-assets.mjs), next to the wordmark set in the site's serif.
// next/image serves it at the right size for each screen (1x, 2x, 3x).

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/marquee-symbol.png"
      alt=""
      width={439}
      height={225}
      // In the header on every page: load it right away, never lazily.
      loading="eager"
      sizes="64px"
      className={cn("h-6 w-auto shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

/** Symbol + wordmark, as used in the header and menus. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 sm:gap-2.5", className)}>
      <LogoMark className="h-[1.3rem] sm:h-6" />
      <span className="font-display text-[1.25rem] leading-none tracking-[-0.03em] sm:text-[1.4rem]">Marquee</span>
    </span>
  );
}
