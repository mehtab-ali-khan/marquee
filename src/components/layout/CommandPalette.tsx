"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { ArrowUpRight, Clapperboard, Loader2, Search, Tv, UserRound, X } from "lucide-react";
import { posterUrl } from "@/lib/tmdb/images";
import type { SearchItem } from "@/lib/tmdb/search-items";

const kindIcon = { movie: Clapperboard, tv: Tv, person: UserRound };

type SearchResponse = { query: string; results: SearchItem[]; failed?: boolean };

export function CommandPalette() {
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  const [source, setSource] = useState<DOMRect | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const trimmed = query.trim();
  const loading = Boolean(trimmed && response?.query !== trimmed);
  const results = response?.query === trimmed ? response.results : [];
  const failed = response?.query === trimmed && response.failed;

  const changeOpen = useCallback((next: boolean) => {
    if (next) setSource(trigger.current?.getBoundingClientRect() ?? null);
    setOpen(next);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!event.repeat && event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        changeOpen(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [changeOpen, open]);

  useEffect(() => {
    if (!open || !trimmed) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { results: SearchItem[] };
        if (!controller.signal.aborted) setResponse({ query: trimmed, results: data.results });
      } catch {
        if (!controller.signal.aborted) setResponse({ query: trimmed, results: [], failed: true });
      }
    }, 180); // wait for a short pause in typing (fewer requests, still feels instant)

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, trimmed]);

  function updateQuery(value: string) {
    setQuery(value);
    if (value.trim() !== trimmed) setResponse(null);
  }

  function go(href: string) {
    setOpen(false);
    updateQuery("");
    router.push(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger
        ref={trigger}
        aria-label="Search"
        aria-keyshortcuts="Meta+K Control+K"
        className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2.5 rounded-full border border-white/15 bg-canvas/45 text-sm text-fg/80 transition-[background-color,border-color,color,box-shadow,transform] duration-250 hover:border-accent/60 hover:bg-surface hover:text-fg hover:shadow-[0_0_20px_-10px_var(--color-accent)] active:scale-95 data-[state=open]:border-accent/70 sm:w-full sm:justify-start sm:px-3.5"
      >
        <Search className="size-4 shrink-0 transition-colors group-hover:text-accent" aria-hidden="true" />
        {/* whitespace-nowrap + truncate: never wrap; if space ever runs short, show "Search Mar…" */}
        <span className="hidden min-w-0 truncate whitespace-nowrap sm:inline">Search Marquee</span>
        <kbd className="ml-auto hidden shrink-0 rounded-sm border border-white/15 px-1.5 font-sans text-[11px] whitespace-nowrap text-fg/65 sm:inline" aria-hidden="true">⌘ K</kbd>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          style={source ? {
            "--marquee-search-source-width": `${source.width}px`,
            "--marquee-search-source-height": `${source.height}px`,
            "--marquee-search-source-top": `${source.top}px`,
          } as CSSProperties : undefined}
          className="marquee-search-dialog fixed left-1/2 z-50 w-[min(94vw,700px)] -translate-x-1/2 overflow-hidden rounded-lg border border-white/15 border-t-accent/50 bg-surface shadow-2xl">
          <Dialog.Title className="sr-only">Search Marquee</Dialog.Title>
          <Dialog.Description className="sr-only">Find movies, TV shows and people. Use arrow keys to move through results.</Dialog.Description>
          <Command shouldFilter={false} label="Search catalog">
            <div className="flex min-w-0 items-center gap-3 border-b border-line px-3 sm:px-5">
              <Search className="size-5 shrink-0 text-accent" aria-hidden="true" />
              <Command.Input value={query} onValueChange={updateQuery} aria-label="Search movies, TV shows and people"
                placeholder="Search movies, shows, people…"
                className="h-16 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-muted focus-visible:outline-none"
              />
              {loading && <Loader2 className="size-4 shrink-0 animate-spin text-fg-muted" aria-hidden="true" />}
              <Dialog.Close aria-label="Close search" className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-fg-muted hover:text-fg">
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            </div>

            <Command.List className="max-h-[min(50svh,29rem)] overflow-y-auto p-2" aria-busy={loading}>
              {!trimmed && <p className="px-3 py-5 text-sm text-fg-muted">Search by title or name.</p>}
              {loading && <Command.Loading className="px-3 py-5 text-sm text-fg-muted">Searching…</Command.Loading>}
              {failed && <p role="status" className="px-3 py-5 text-sm text-fg-muted">Search is temporarily unavailable. Try again in a moment.</p>}
              {trimmed && !loading && !failed && results.length === 0 && (
                <Command.Empty className="px-3 py-5 text-sm text-fg-muted">No results for “{trimmed}”.</Command.Empty>
              )}

              {results.map((item) => {
                const Icon = kindIcon[item.kind];
                const thumb = posterUrl(item.imagePath, "w92");
                return (
                  <Command.Item key={item.key} value={item.key} onSelect={() => go(item.href)}
                    className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 data-[selected=true]:bg-raised"
                  >
                    <span className="relative grid h-12 w-8 shrink-0 place-items-center overflow-hidden rounded-sm bg-canvas">
                      {thumb
                        ? <Image src={thumb} alt="" fill sizes="32px" className="object-cover" />
                        : <Icon className="size-4 text-fg-muted" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{item.title}</span>
                      <span className="block truncate text-xs text-fg-muted">{item.subtitle}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-fg-muted group-data-[selected=true]:text-accent" />
                  </Command.Item>
                );
              })}

              {results.length > 0 && (
                <Command.Item value="see-all" onSelect={() => go(`/search?q=${encodeURIComponent(trimmed)}`)}
                  className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border-t border-line px-3 py-3 text-sm text-fg-muted data-[selected=true]:bg-raised data-[selected=true]:text-fg">
                  <Search className="size-4 shrink-0" aria-hidden="true" /> <span className="truncate">See all results for “{trimmed}”</span>
                </Command.Item>
              )}
            </Command.List>
          </Command>

          <div className="hidden gap-4 border-t border-line px-5 py-3 text-xs text-fg-muted sm:flex" aria-hidden="true">
            <span><kbd className="font-sans text-fg">↑ ↓</kbd> Navigate</span>
            <span><kbd className="font-sans text-fg">↵</kbd> Open</span>
            <span className="ml-auto"><kbd className="font-sans text-fg">Esc</kbd> Close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
