"use client";
// ↑ This line makes it a Client Component: it runs in the browser too.
// We need that because only the browser knows the CURRENT URL as you click
// around. Everything else in the header stays a Server Component.

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

const baseClasses = cn(
  "relative rounded-sm px-3 py-2 text-sm transition-colors duration-150",
  // A thin brass line under the active link, which grows in from the center.
  "after:absolute after:inset-x-3 after:-bottom-[13px] after:h-px after:bg-accent",
  "after:origin-center after:transition-transform after:duration-250 after:ease-out-soft",
);

/**
 * On pages like /movie/[id], the URL is only known when someone visits.
 * Next pre-builds the page "shell" before that, so usePathname() must sit
 * inside <Suspense>. Until the URL is known, we show the same link without
 * the active highlight (the fallback). It looks identical, so nobody notices.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className={cn(baseClasses, "text-fg-muted after:scale-x-0 hover:text-fg")}>
          {props.children}
        </Link>
      }
    >
      <ActiveAwareLink {...props} />
    </Suspense>
  );
}

function ActiveAwareLink({ href, children }: NavLinkProps) {
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
        baseClasses,
        isActive ? "text-fg after:scale-x-100" : "text-fg-muted after:scale-x-0 hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}
