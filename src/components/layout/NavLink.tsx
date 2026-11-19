"use client";
// ↑ This line makes it a Client Component: it runs in the browser too.
// We need that because only the browser knows the CURRENT URL as you click
// around. Everything else in the header stays a Server Component.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function NavLink({ href, children }: NavLinkProps) {
  // Like React Router's useLocation().pathname, e.g. "/discover"
  const pathname = usePathname();

  // "/" must match exactly (otherwise Home would be active everywhere).
  // Other links also stay active on their sub-pages: /library/favorites → Library.
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      // Tells screen readers "this is the page you're on".
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative rounded-sm px-3 py-2 text-sm transition-colors duration-150",
        isActive ? "text-fg" : "text-fg-muted hover:text-fg",
        // A thin brass line under the active link, which grows in from the center.
        "after:absolute after:inset-x-3 after:-bottom-[13px] after:h-px after:bg-accent",
        "after:origin-center after:transition-transform after:duration-250 after:ease-out-soft",
        isActive ? "after:scale-x-100" : "after:scale-x-0",
      )}
    >
      {children}
    </Link>
  );
}
