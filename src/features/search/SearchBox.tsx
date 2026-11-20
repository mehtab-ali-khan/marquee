"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

// The big search field on /search.
// - Results update while you type (after a short pause), so no Search button is needed.
// - Enter still works: it searches right away instead of waiting for the pause.
// - It is a real <form> (next/form): without JavaScript it still submits to /search?q=…
// The URL stays the single source of truth; this only decides WHEN to change it.

const TYPING_PAUSE_MS = 350;

export function SearchBox({ query, type }: { query: string; type: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(query);
  const [isPending, startTransition] = useTransition();

  // The URL can change without typing (back button, a suggestion chip):
  // adopt the new query during render, the React-recommended way to sync from props.
  // But when the URL only caught up with what WE sent, keep the field as is:
  // the user may have typed more letters in the meantime.
  const [seenQuery, setSeenQuery] = useState(query);
  const [sentQuery, setSentQuery] = useState<string | null>(null);
  if (query !== seenQuery) {
    setSeenQuery(query);
    if (query !== sentQuery) setValue(query);
  }

  const trimmed = value.trim();

  function hrefFor(q: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type !== "all") params.set("type", type);
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  }

  // Live results: after a pause in typing, replace (not push) the URL,
  // so the back button skips the in-between "d", "du", "dun".
  useEffect(() => {
    if (trimmed === query) return;
    const timer = window.setTimeout(() => {
      setSentQuery(trimmed);
      startTransition(() => router.replace(hrefFor(trimmed), { scroll: false }));
    }, TYPING_PAUSE_MS);
    return () => window.clearTimeout(timer);
    // hrefFor only depends on `type`, already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, query, type, router]);

  return (
    <Form
      action="/search"
      role="search"
      onSubmit={(event) => {
        // Enter or the button: go now, and make it a real history entry.
        event.preventDefault();
        setSentQuery(trimmed);
        startTransition(() => router.push(hrefFor(trimmed), { scroll: false }));
      }}
      className="group relative flex h-16 items-center gap-2 rounded-full border border-line bg-surface pr-3 pl-5 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.8)] transition-[border-color,box-shadow] duration-200 focus-within:border-accent/70 focus-within:shadow-[0_0_0_4px_rgb(228_168_83/0.12)] sm:h-[4.5rem]"
    >
      {isPending ? (
        <Loader2 className="size-5 shrink-0 animate-spin text-accent" aria-hidden="true" />
      ) : (
        <Search className="size-5 shrink-0 text-fg-subtle transition-colors group-focus-within:text-accent" aria-hidden="true" />
      )}
      <input
        ref={input}
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoFocus={!query}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        placeholder="Films, series, actors, directors…"
        aria-label="Search movies, TV shows and people"
        className="h-full min-w-0 flex-1 bg-transparent text-lg text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none sm:text-xl"
      />
      {type !== "all" && <input type="hidden" name="type" value={type} />}
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            input.current?.focus();
          }}
          className="grid size-9 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-raised hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </Form>
  );
}
