import Link from "next/link";
import { Search } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { NavLink } from "./NavLink";

// The bar at the top of every page.
// It's a Server Component: no state, no clicks handled in JavaScript,
// just links. So it costs zero JavaScript in the browser.

const navItems = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/library", label: "Library" },
];

export function Header() {
  return (
    // sticky + top-0: stays at the top while you scroll.
    // bg-canvas/80 + backdrop-blur: slightly see-through, blurring the page behind it.
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-md">
      <Container className="flex h-16 items-center gap-8">
        {/* Wordmark: the logo is just styled text, with one brass "marquee bulb". */}
        <Link href="/" className="flex items-center gap-2" aria-label="Marquee home">
          <span className="size-2 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />
          <span className="font-display text-xl tracking-tight">Marquee</span>
        </Link>

        {/* Main navigation. Hidden on small screens for now (mobile menu comes later). */}
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                {/* NavLink is a small Client Component inside this Server Component. */}
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side. ml-auto pushes this group to the far right. */}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" aria-label="Search" className={buttonStyles({ variant: "ghost", size: "icon" })}>
            <Search />
          </Link>
          <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Sign in
          </Link>
        </div>
      </Container>
    </header>
  );
}
