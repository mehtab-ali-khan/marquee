"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Clapperboard, Loader2, Search, Tv, UserRound } from "lucide-react";
import { posterUrl } from "@/lib/tmdb/images";
import type { SearchItem } from "@/lib/tmdb/search-items";
import { buttonStyles } from "@/components/ui/Button";

// The ⌘K / Ctrl+K search palette.
//  - cmdk gives us the accessible list: arrow keys move, Enter picks, screen
//    readers announce the active item. Its dialog is built on Radix (like the trailer).
//  - We fetch from OUR /api/search route (never TMDB directly: the token stays on the server).

/** Returns `value`, but only after it stopped changing for `delay` ms. */
function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // a new keystroke cancels the pending update
  }, [value, delay]);
  return debounced;
}

const KIND_ICON = { movie: Clapperboard, tv: Tv, person: UserRound };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Wait until the user pauses typing (250ms) before asking the server.
  // Typing "interstellar" = 1 request instead of 12.
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  // Global shortcut: ⌘K (Mac) or Ctrl+K (Windows/Linux) toggles the palette.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault(); // stop the browser's own Ctrl+K (search bar in some browsers)
        setOpen((isOpen) => !isOpen);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch results whenever the debounced query changes.
  useEffect(() => {
    if (!debouncedQuery) return;

    // If the user keeps typing, cancel the older, now-useless request, so a
    // slow answer for "inter" can't overwrite the newer answer for "interstellar".
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal })
      .then((res) => res.json() as Promise<{ results: SearchItem[] }>)
      .then((data) => {
        setResults(data.results);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return; // we cancelled it
        setResults([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  function updateQuery(value: string) {
    setQuery(value);
    // Show the spinner right away while we wait for the debounce + server.
    setLoading(value.trim().length > 0);
    if (!value.trim()) setResults([]);
  }

  function go(href: string) {
    setOpen(false);
    updateQuery("");
    router.push(href);
  }

  const trimmed = query.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search (⌘K)"
        className={buttonStyles({ variant: "ghost", size: "sm", className: "gap-3" })}
      >
        <Search />
        <kbd className="hidden rounded-sm border border-line px-1.5 font-sans text-[11px] text-fg-subtle md:inline">
          ⌘K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Search movies, TV shows and people"
        shouldFilter={false} // the server already returns matching results; don't re-filter
        overlayClassName="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
        contentClassName="fixed top-[12vh] left-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-raised shadow-2xl data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
          <Command.Input
            value={query}
            onValueChange={updateQuery}
            placeholder="Search movies, TV shows, people…"
            className="h-14 w-full bg-transparent text-base text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-fg-subtle" aria-label="Loading" />}
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {!trimmed && <p className="px-3 py-6 text-center text-sm text-fg-subtle">Start typing to search.</p>}

          {trimmed && !loading && results.length === 0 && (
            <Command.Empty className="px-3 py-6 text-center text-sm text-fg-subtle">
              No results for “{trimmed}”.
            </Command.Empty>
          )}

          {results.map((item) => {
            const Icon = KIND_ICON[item.kind];
            const thumb = posterUrl(item.imagePath, "w92");
            return (
              <Command.Item
                key={item.key}
                value={item.key}
                onSelect={() => go(item.href)}
                // data-[selected=true]: cmdk marks the item chosen with arrow keys/mouse
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 data-[selected=true]:bg-surface"
              >
                <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-sm bg-surface">
                  {thumb ? (
                    <Image src={thumb} alt="" fill sizes="32px" className="object-cover" />
                  ) : (
                    <Icon className="m-auto mt-3.5 size-4 text-fg-subtle" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{item.title}</p>
                  <p className="truncate text-xs text-fg-subtle">{item.subtitle}</p>
                </div>
              </Command.Item>
            );
          })}

          {trimmed && results.length > 0 && (
            <Command.Item
              value="see-all"
              onSelect={() => go(`/search?q=${encodeURIComponent(trimmed)}`)}
              className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border-t border-line px-3 py-3 text-sm text-fg-muted data-[selected=true]:bg-surface data-[selected=true]:text-fg"
            >
              <Search className="size-4" aria-hidden="true" /> See all results for “{trimmed}”
            </Command.Item>
          )}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
