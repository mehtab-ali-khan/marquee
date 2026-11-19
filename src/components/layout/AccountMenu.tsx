"use client";

import Image from "next/image";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowUpRight, Bookmark, LogOut } from "lucide-react";
import { signOut } from "@/features/auth/actions";

// The avatar button + dropdown for a signed-in user. A Client Component
// (opening/closing is interaction). Radix handles keyboard support: Enter or
// Space opens it, arrow keys move between items, Escape closes it.
//
// It receives only harmless display data (name, avatar), never the session id.

type AccountMenuProps = {
  username: string;
  name: string;
  avatarUrl: string | null;
};

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-fg-muted outline-none data-[highlighted]:bg-surface data-[highlighted]:text-fg";

export function AccountMenu({ username, name, avatarUrl }: AccountMenuProps) {
  const initial = (name || username).charAt(0).toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Account menu for ${username}`}
        className="relative size-9 overflow-hidden rounded-full border border-line bg-surface transition-colors duration-150 hover:border-fg-subtle"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="36px" className="object-cover" />
        ) : (
          <span className="font-display text-base text-fg">{initial}</span>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 rounded-md border border-line bg-raised p-1.5 shadow-2xl data-[state=closed]:animate-fade-out data-[state=open]:animate-dialog-in"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm text-fg">{name || username}</p>
            <p className="truncate text-xs text-fg-subtle">@{username} on TMDB</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/library">
              <Bookmark className="size-4" aria-hidden="true" /> Your library
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <a href={`https://www.themoviedb.org/u/${username}`} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight className="size-4" aria-hidden="true" /> TMDB profile
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          {/* Sign out = a form that calls the signOut Server Action.
              preventDefault keeps the menu open (and the form in the page)
              until the action finishes and redirects. */}
          <form action={signOut}>
            <DropdownMenu.Item asChild className={itemClass} onSelect={(event) => event.preventDefault()}>
              <button type="submit" className="w-full">
                <LogOut className="size-4" aria-hidden="true" /> Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
