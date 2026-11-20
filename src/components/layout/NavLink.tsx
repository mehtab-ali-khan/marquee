"use client";

import { Suspense, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

function NavTrack({ items, activeIndex = -1, destination = activeIndex, onNavigate }: {
  items: NavItem[];
  activeIndex?: number;
  destination?: number;
  onNavigate?: (index: number, href: string) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const indicatorIndex = hovered ?? destination;

  return (
    <nav aria-label="Main" className="hidden shrink-0 lg:block">
      <ul className="relative isolate grid grid-flow-col auto-cols-fr items-center rounded-full border border-white/10 bg-canvas/35 p-1"
        onPointerLeave={() => setHovered(null)}>
        <li aria-hidden="true" className="marquee-nav-indicator pointer-events-none absolute inset-y-1 left-1 -z-10 rounded-full border border-accent/40 bg-accent/10"
          data-active={indicatorIndex >= 0}
          style={{
            width: `calc((100% - 8px) / ${items.length})`,
            transform: `translateX(${Math.max(0, indicatorIndex) * 100}%)`,
          }}
        />
        {items.map(({ href, label }, index) => (
          <li key={href}>
            <Link href={href} aria-current={index === activeIndex ? "page" : undefined}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(index); }}
              onNavigate={onNavigate && ((event) => {
                if (index === activeIndex) return;
                event.preventDefault();
                onNavigate(index, href);
              })}
              className={cn(
                "flex min-h-8 items-center justify-center rounded-full px-2 text-sm font-medium transition-[color,transform] duration-200 hover:text-fg active:scale-95 xl:px-2.5",
                index === destination ? "text-accent" : "text-fg/75",
              )}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ActiveNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeIndex = items.findIndex(({ href }) => pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`)));
  const [destination, setDestination] = useOptimistic(activeIndex);
  const [, startTransition] = useTransition();

  function navigate(index: number, href: string) {
    startTransition(() => {
      setDestination(index);
      router.push(href);
    });
  }

  return <NavTrack items={items} activeIndex={activeIndex} destination={destination} onNavigate={navigate} />;
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  return (
    <Suspense fallback={<NavTrack items={items} />}>
      <ActiveNav items={items} />
    </Suspense>
  );
}
