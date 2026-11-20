import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { CommandPalette } from "./CommandPalette";
import { HeaderFrame, MobileNav } from "./HeaderFrame";
import { DesktopNav } from "./NavLink";
import { MobileAccount, UserMenu, UserMenuFallback } from "./UserMenu";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/library", label: "Library" },
];

export function Header() {
  return (
    <HeaderFrame>
      {/* Flex with explicit gaps: logo · nav on the left, search in the middle
          (it grows to fill the space, up to 22rem), account on the right. Below lg
          the search shrinks to an icon or a short field next to the menu button. */}
      <Container className="flex h-full items-center gap-2 sm:gap-3 lg:gap-8">
        <div className="flex shrink-0 items-center gap-6 xl:gap-8">
          <Link href="/" aria-label="Marquee home" className="group flex w-fit shrink-0 items-center gap-1.5 rounded-sm sm:gap-2">
            <span className="grid size-5 place-items-center rounded-[5px] border border-accent/45 bg-canvas/60 sm:size-7" aria-hidden="true">
              <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)] transition-transform group-hover:scale-125" />
            </span>
            <span className="font-display text-[1.2rem] tracking-[-0.04em] sm:text-xl">Marquee</span>
          </Link>
          <DesktopNav items={navItems} />
        </div>

        <div className="ml-auto flex min-w-0 justify-center lg:ml-0 lg:flex-1">
          <div className="sm:w-56 lg:w-full lg:max-w-[22rem]">
            <CommandPalette />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Desktop: avatar menu. Phones/tablets: everything lives in the full-screen menu. */}
          <div className="hidden lg:block">
            <Suspense fallback={<UserMenuFallback />}><UserMenu /></Suspense>
          </div>
          <MobileNav
            items={navItems}
            account={<Suspense fallback={<div className="h-44 rounded-xl border border-line bg-surface" />}><MobileAccount /></Suspense>}
          />
        </div>
      </Container>
    </HeaderFrame>
  );
}
