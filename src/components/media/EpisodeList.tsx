"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { EpisodeItem } from "@/lib/tmdb/episodes";
import { backdropUrl } from "@/lib/tmdb/images";

// The "Episodes" section for a show (Netflix-style).
//  - The season shown first comes from the server with the page (no wait).
//  - Other seasons load on demand from /api/tv/[id]/season/[n] and are
//    remembered, so switching back is instant.
//  - While a season loads, skeleton rows with the SAME height hold its place.

type SeasonOption = { number: number; name: string; episodeCount: number };

type EpisodeListProps = {
  showId: number;
  seasons: SeasonOption[];
  initialSeason: number;
  initialEpisodes: EpisodeItem[];
  /** false when the page already titles this section (e.g. a numbered chapter). */
  showHeading?: boolean;
};

export function EpisodeList({ showId, seasons, initialSeason, initialEpisodes, showHeading = true }: EpisodeListProps) {
  const [selected, setSelected] = useState(initialSeason);
  const [loaded, setLoaded] = useState<Record<number, EpisodeItem[]>>({ [initialSeason]: initialEpisodes });
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [retry, setRetry] = useState(0);

  const episodes = loaded[selected];
  const error = failed[selected] ?? false;
  const current = seasons.find((s) => s.number === selected);

  // Fetch the selected season if we don't have it yet. State is only set in
  // the async callbacks; "loading" is DERIVED (no episodes and no error).
  useEffect(() => {
    if (loaded[selected] || failed[selected]) return;
    const controller = new AbortController();
    fetch(`/api/tv/${showId}/season/${selected}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ episodes: EpisodeItem[] }>) : Promise.reject(res.status)))
      .then((data) => setLoaded((prev) => ({ ...prev, [selected]: data.episodes })))
      .catch(() => {
        // Switched to another season before this one arrived: not an error.
        if (!controller.signal.aborted) setFailed((prev) => ({ ...prev, [selected]: true }));
      });
    return () => controller.abort();
  }, [showId, selected, loaded, failed, retry]);

  return (
    <section aria-labelledby={showHeading ? "episodes-heading" : undefined}>
      <div className="mb-4 flex items-center justify-between gap-4">
        {showHeading ? (
          <h3 id="episodes-heading" className="text-xl">
            Episodes
          </h3>
        ) : (
          <span />
        )}
        {seasons.length > 1 ? (
          <SeasonMenu seasons={seasons} selected={selected} onSelect={setSelected} />
        ) : (
          <span className="text-sm text-fg-muted">{current?.name}</span>
        )}
      </div>

      {/* aria-busy tells screen readers this list is being refreshed. */}
      <ol aria-busy={!episodes && !error} className="border-t border-line">
        {error ? (
          <li className="flex items-center justify-between gap-4 py-6 text-sm text-fg-muted">
            Couldn’t load this season.
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFailed((prev) => ({ ...prev, [selected]: false }));
                setRetry((n) => n + 1);
              }}
            >
              Try again
            </Button>
          </li>
        ) : episodes ? (
          episodes.length > 0 ? (
            episodes.map((episode) => <EpisodeRow key={episode.id} episode={episode} />)
          ) : (
            <li className="py-6 text-sm text-fg-muted">No episodes listed for this season yet.</li>
          )
        ) : (
          Array.from({ length: Math.min(Math.max(current?.episodeCount ?? 4, 1), 6) }, (_, i) => <EpisodeRowSkeleton key={i} />)
        )}
      </ol>
    </section>
  );
}

const ROW = "grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-4 border-b border-line py-4 sm:grid-cols-[2rem_9rem_minmax(0,1fr)] sm:gap-5";

function EpisodeRow({ episode }: { episode: EpisodeItem }) {
  const still = backdropUrl(episode.stillPath, "w300");
  return (
    <li className={ROW}>
      <span className="hidden self-center text-center text-2xl text-fg-subtle tabular-nums sm:block">{episode.number}</span>
      <div className="relative aspect-video overflow-hidden rounded-md bg-raised">
        {still && <Image src={still} alt="" fill sizes="(min-width: 640px) 144px, 112px" className="object-cover" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-fg sm:text-base">
            <span className="mr-1.5 text-fg-subtle tabular-nums sm:hidden">{episode.number}.</span>
            {episode.title}
          </p>
          {episode.runtime && <span className="shrink-0 text-sm text-fg-subtle tabular-nums">{episode.runtime}</span>}
        </div>
        {episode.overview && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-fg-muted">{episode.overview}</p>}
      </div>
    </li>
  );
}

/** Same grid and height as a real row, so the list doesn't jump when episodes arrive. */
function EpisodeRowSkeleton() {
  return (
    <li className={ROW} aria-hidden="true">
      <span className="hidden h-7 w-6 self-center justify-self-center rounded-sm bg-raised sm:block" />
      <div className="aspect-video animate-pulse rounded-md bg-raised" />
      <div className="space-y-2 pt-1">
        <div className="h-4 w-1/2 rounded-sm bg-raised" />
        <div className="h-3 w-full rounded-sm bg-raised" />
        <div className="h-3 w-4/5 rounded-sm bg-raised" />
      </div>
    </li>
  );
}

/** Accessible season picker: a real menu (role="menu", radio items, arrow keys). */
function SeasonMenu({
  seasons,
  selected,
  onSelect,
}: {
  seasons: SeasonOption[];
  selected: number;
  onSelect: (season: number) => void;
}) {
  const current = seasons.find((s) => s.number === selected);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex h-10 items-center gap-2 rounded-md border border-line bg-raised px-3.5 text-sm text-fg transition-colors duration-150 hover:border-fg-subtle data-[state=open]:border-fg-subtle">
        {current?.name ?? `Season ${selected}`}
        <ChevronDown className="size-4 text-fg-muted" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          // Above the detail modal (z-50).
          className="z-[60] max-h-80 min-w-56 overflow-y-auto rounded-md border border-line bg-raised p-1.5 shadow-2xl data-[state=open]:animate-dialog-in"
        >
          <DropdownMenu.RadioGroup value={String(selected)} onValueChange={(value) => onSelect(Number(value))}>
            {seasons.map((season) => (
              <DropdownMenu.RadioItem
                key={season.number}
                value={String(season.number)}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-fg-muted outline-none data-[highlighted]:bg-surface data-[highlighted]:text-fg data-[state=checked]:text-fg"
              >
                <span className="grid size-4 place-items-center">
                  <DropdownMenu.ItemIndicator>
                    <Check className="size-3.5 text-accent" aria-hidden="true" />
                  </DropdownMenu.ItemIndicator>
                </span>
                {season.name}
                <span className="ml-auto pl-4 text-xs text-fg-subtle tabular-nums">
                  {season.episodeCount} {season.episodeCount === 1 ? "episode" : "episodes"}
                </span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
