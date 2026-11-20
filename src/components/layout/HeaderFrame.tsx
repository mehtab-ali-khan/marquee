"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

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

type NavItem = { href: string; label: string };

/**
 * Below desktop width, the nav lives in a menu:
 * - phones: full screen (nothing else would fit anyway);
 * - tablets / small laptops: a drawer sliding in from the right over the dimmed
 *   page, so the menu never stretches across a wide, mostly empty screen.
 * Radix Dialog gives us focus trapping, Escape to close, and scroll locking.
 * `account` is rendered on the server (it reads the session) and passed in.
 */
export function MobileNav({ items, account }: { items: NavItem[]; account: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-canvas/45 text-fg/90 transition-[border-color,color,transform] duration-200 hover:border-accent/60 hover:text-accent active:scale-95 lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* The dimmed page behind the drawer (tablets); tapping it closes the menu. */}
        <Dialog.Overlay className="mobile-sheet-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          // Any link tapped inside the menu (including the server-rendered
          // account links) closes it; the page underneath then changes.
          onClickCapture={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className="mobile-sheet fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-canvas shadow-[-24px_0_60px_-20px_rgb(0_0_0/0.8)] sm:w-[24rem] sm:border-l sm:border-line lg:hidden"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="flex h-[var(--marquee-header-height)] shrink-0 items-center justify-between border-b border-line px-4 sm:px-6">
            <Link href="/" aria-label="Marquee home">
              <Logo />
            </Link>
            <Dialog.Close
              aria-label="Close menu"
              className="grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-[color,transform] hover:text-fg active:scale-95"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-6 sm:px-6">
            {/* No search field here: the header keeps its search button right beside the menu button. */}
            <nav aria-label="Main">
              <Suspense fallback={<SheetLinks items={items} active={-1} />}>
                <ActiveSheetLinks items={items} />
              </Suspense>
            </nav>

            <div className="mobile-sheet-item mt-8" style={{ "--i": items.length + 1 } as React.CSSProperties}>
              {account}
            </div>
            <p className="mt-auto pt-8 text-center text-xs text-fg-subtle">Film and TV data from TMDB.</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// usePathname must sit inside Suspense on dynamic pages, hence the split.
function ActiveSheetLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = items.findIndex(({ href }) => pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`)));
  return <SheetLinks items={items} active={active} />;
}

function SheetLinks({ items, active }: { items: NavItem[]; active: number }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {items.map((item, index) => (
        <li key={item.href} className="mobile-sheet-item" style={{ "--i": index + 1 } as React.CSSProperties}>
          <Link
            href={item.href}
            aria-current={index === active ? "page" : undefined}
            className={cn(
              "group flex items-baseline gap-4 py-3.5 transition-colors",
              index === active ? "text-accent" : "text-fg active:text-accent",
            )}
          >
            <span className="w-6 text-xs font-semibold tracking-[0.2em] text-fg-subtle tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <span className="font-display text-[1.75rem] leading-none">{item.label}</span>
            <ArrowRight
              className={cn("ml-auto size-4 self-center transition-transform group-active:translate-x-1", index === active ? "text-accent" : "text-fg-subtle")}
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ol>
  );
}
