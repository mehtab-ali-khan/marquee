"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowUpRight, ChevronDown, Library, LogOut } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { libraryShelves, type AccountInfo } from "./account";

// The signed-in user's menu (desktop). A Client Component because opening and
// closing is interaction; Radix gives it full keyboard support (Enter/Space to
// open, arrows to move, Escape to close) and returns focus to the button.
//
// It only receives harmless display data (name, avatar), never the session id.

const itemClass =
  "flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-fg-muted outline-none transition-colors data-[highlighted]:bg-surface data-[highlighted]:text-fg [&_svg]:size-4 [&_svg]:shrink-0";

/**
 * The user’s TMDB avatar in a circle, or a brass monogram when there is none.
 * Some TMDB avatars are tiny or banner-shaped (we saw a 29×7 px one): cropped
 * into a circle they look like a smudge, so those fall back to the monogram too.
 */
export function Avatar({ account, size }: { account: AccountInfo; size: number }) {
  const initial = (account.name || account.username).charAt(0).toUpperCase();
  const [unusable, setUnusable] = useState(false);
  const showImage = account.avatarUrl && !unusable;
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(140deg,var(--color-accent),#8a5a1c)] font-display text-on-accent"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {showImage ? (
        <Image
          src={account.avatarUrl!}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setUnusable(true)}
          onLoad={(event) => {
            const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
            if (Math.min(w, h) < 24 || w / h > 2 || h / w > 2) setUnusable(true);
          }}
        />
      ) : (
        initial
      )}
    </span>
  );
}

export function AccountMenu({ account }: { account: AccountInfo }) {
  const displayName = account.name || account.username;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Account menu for ${displayName}`}
        className="group flex items-center gap-1.5 rounded-full border border-white/15 bg-canvas/45 p-1 pr-2.5 text-fg/70 transition-[border-color,background-color,color] duration-200 hover:border-accent/60 hover:bg-surface hover:text-fg data-[state=open]:border-accent/70 data-[state=open]:text-fg"
      >
        <Avatar account={account} size={30} />
        <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className="z-50 w-72 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-xl border border-line bg-raised p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] data-[state=closed]:animate-fade-out data-[state=open]:animate-dialog-in"
        >
          {/* Profile card: who is signed in, with a faint brass glow. */}
          <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-3">
            <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent/15 blur-2xl" aria-hidden="true" />
            <div className="relative flex items-center gap-3">
              <span className="rounded-full p-0.5 ring-1 ring-accent/50">
                <Avatar account={account} size={44} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight text-fg">{displayName}</p>
                <p className="truncate text-xs text-fg-subtle">@{account.username} · TMDB</p>
              </div>
            </div>
          </div>

          {/* The three shelves as one-tap tiles. */}
          <DropdownMenu.Group className="mt-2 grid grid-cols-3 gap-1.5">
            {libraryShelves.map(({ tab, label, icon: Icon }) => (
              <DropdownMenu.Item key={tab} asChild>
                <Link
                  href={tab === "watchlist" ? "/library" : `/library?tab=${tab}`}
                  className="flex flex-col items-center gap-1.5 rounded-md border border-line px-1 py-3 text-xs text-fg-muted outline-none transition-colors data-[highlighted]:border-accent/50 data-[highlighted]:bg-accent/10 data-[highlighted]:text-fg"
                >
                  <Icon className="size-4 text-accent" aria-hidden="true" />
                  {label}
                </Link>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Group>

          <DropdownMenu.Separator className="my-2 h-px bg-line" />

          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/library">
              <Library aria-hidden="true" /> Your library
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <a href={`https://www.themoviedb.org/u/${account.username}`} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight aria-hidden="true" /> Profile on TMDB
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-2 h-px bg-line" />

          {/* Sign out = a form that calls the signOut Server Action.
              preventDefault keeps the menu (and so the form) mounted until
              the action finishes and redirects. */}
          <form action={signOut}>
            <DropdownMenu.Item
              asChild
              className={`${itemClass} data-[highlighted]:bg-danger/10 data-[highlighted]:text-danger`}
              onSelect={(event) => event.preventDefault()}
            >
              <button type="submit" className="w-full">
                <LogOut aria-hidden="true" /> Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
