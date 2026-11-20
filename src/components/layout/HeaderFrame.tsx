"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
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
 * Phones and tablets: a full-screen menu instead of a tiny dropdown.
 * Big serif links (easy thumb targets), search, and the account section.
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
        <Dialog.Content
          aria-describedby={undefined}
          // Any link tapped inside the menu (including the server-rendered
          // account links) closes it; the page underneath then changes.
          onClickCapture={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className="mobile-sheet fixed inset-0 z-50 flex flex-col bg-canvas lg:hidden"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          {/* Same height and logo position as the header, so opening feels like the header unfolding. */}
          <Container className="flex h-[var(--marquee-header-height)] shrink-0 items-center justify-between border-b border-line">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-[5px] border border-accent/45 sm:size-7" aria-hidden="true">
                <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
              </span>
              <span className="font-display text-[1.2rem] tracking-[-0.04em] sm:text-xl">Marquee</span>
            </Link>
            <Dialog.Close
              aria-label="Close menu"
              className="grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-[color,transform] hover:text-fg active:scale-95"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </Container>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <Container className="flex min-h-full flex-col py-6">
              <Link
                href="/search"
                className="mobile-sheet-item flex h-12 items-center gap-3 rounded-full border border-line bg-surface px-4 text-fg-subtle"
                style={{ "--i": 0 } as React.CSSProperties}
              >
                <Search className="size-4 text-accent" aria-hidden="true" />
                Search films, series, people…
              </Link>

              <nav aria-label="Main" className="mt-6">
                <Suspense fallback={<SheetLinks items={items} active={-1} />}>
                  <ActiveSheetLinks items={items} />
                </Suspense>
              </nav>

              <div className="mobile-sheet-item mt-auto pt-8" style={{ "--i": items.length + 1 } as React.CSSProperties}>
                {account}
                <p className="mt-6 text-center text-xs text-fg-subtle">Film and TV data from TMDB.</p>
              </div>
            </Container>
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
              "group flex items-baseline gap-4 py-4 transition-colors",
              index === active ? "text-accent" : "text-fg active:text-accent",
            )}
          >
            <span className="w-6 text-xs font-semibold tracking-[0.2em] text-fg-subtle tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <span className="font-display text-4xl leading-none sm:text-5xl">{item.label}</span>
            <ArrowRight
              className={cn("ml-auto size-5 self-center transition-transform group-active:translate-x-1", index === active ? "text-accent" : "text-fg-subtle")}
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ol>
  );
}
