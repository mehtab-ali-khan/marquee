"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Menu } from "lucide-react";

export function HeaderFrame({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header data-scrolled={scrolled} className="marquee-site-header sticky top-0 z-40 border-b">
      {children}
    </header>
  );
}

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Open navigation"
        className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-fg/90 transition-colors hover:border-accent/60 hover:text-accent lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 min-w-40 rounded-lg border border-line bg-surface p-1.5 shadow-2xl data-[state=open]:animate-dialog-in"
        >
          {items.map((item) => (
            <DropdownMenu.Item key={item.href} asChild>
              <Link href={item.href} className="flex min-h-11 items-center rounded-md px-3 text-sm text-fg-muted outline-none data-[highlighted]:bg-raised data-[highlighted]:text-fg">
                {item.label}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
