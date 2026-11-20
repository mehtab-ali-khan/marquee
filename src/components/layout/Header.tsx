import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { CommandPalette } from "./CommandPalette";
import { HeaderFrame, MobileNav } from "./HeaderFrame";
import { DesktopNav } from "./NavLink";
import { UserMenu, UserMenuFallback } from "./UserMenu";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/library", label: "Library" },
];

export function Header() {
  return (
    <HeaderFrame>
      <Container className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2">
        <div className="flex min-w-0 items-center gap-2 xl:gap-5">
          <Link href="/" aria-label="Marquee home" className="group flex w-fit shrink-0 items-center gap-1.5 rounded-sm sm:gap-2">
            <span className="grid size-5 place-items-center rounded-[5px] border border-accent/45 bg-canvas/60 sm:size-7" aria-hidden="true">
              <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)] transition-transform group-hover:scale-125" />
            </span>
            <span className="font-display text-[1.2rem] tracking-[-0.04em] sm:text-xl">Marquee</span>
          </Link>
          <DesktopNav items={navItems} />
        </div>

        {/* 14rem until xl. (17vw at lg was narrower than the sm size: only 174px at
            1024px wide, so "Search Marquee" wrapped onto two lines.) */}
        <div className="sm:w-56 xl:w-[min(25vw,22rem)]">
          <CommandPalette />
        </div>

        <div className="flex items-center justify-self-end gap-1.5 sm:gap-2">
          <Suspense fallback={<UserMenuFallback />}><UserMenu /></Suspense>
          <MobileNav items={navItems} />
        </div>
      </Container>
    </HeaderFrame>
  );
}
