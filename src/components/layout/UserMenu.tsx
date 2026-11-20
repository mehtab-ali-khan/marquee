import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, LogOut } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { profileUrl } from "@/lib/tmdb/images";
import { libraryShelves, type AccountInfo } from "./account";
import { AccountMenu, Avatar } from "./AccountMenu";

// Server Components: they read the session cookie and decide what to show.
// The Header wraps them in <Suspense>, because reading cookies is per-request:
// the rest of the page stays instant (prerendered), and only these small
// pieces wait for "who is this?". getCurrentUser is wrapped in React cache(),
// so the desktop menu and the phone menu share ONE TMDB request.

async function getAccount(): Promise<AccountInfo | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  // w185, not w45: the 45px file looked blurry on high-density screens.
  return { username: user.username, name: user.name, avatarUrl: profileUrl(user.avatarPath, "w185") };
}

/** Desktop: the avatar button + dropdown, or a Sign in button. */
export async function UserMenu() {
  const account = await getAccount();
  if (!account) {
    return (
      <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm", className: "rounded-full px-4" })}>
        Sign in
      </Link>
    );
  }
  return <AccountMenu account={account} />;
}

/** Same size as the real thing, shown while the session is being checked. */
export function UserMenuFallback() {
  return <div className="h-[2.4rem] w-[4.3rem] rounded-full border border-line bg-surface" aria-hidden="true" />;
}

/**
 * Phones and tablets: the account card inside the menu.
 * Who you are on top, your three shelves as full-width rows (easy to tap,
 * easy to scan), and Sign out set apart at the bottom.
 */
export async function MobileAccount() {
  const account = await getAccount();

  if (!account) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="font-display text-xl">Keep your list.</p>
        <p className="mt-1.5 text-sm text-fg-muted">Sign in with your free TMDB account to save, favorite and rate.</p>
        <Link href="/login" className={buttonStyles({ className: "mt-4 w-full rounded-full" })}>
          Sign in <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const displayName = account.name || account.username;
  const row =
    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-fg-muted transition-colors hover:bg-raised hover:text-fg active:bg-raised";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* Who is signed in */}
      <div className="flex items-center gap-3 border-b border-line p-4">
        <span className="rounded-full p-0.5 ring-1 ring-accent/50">
          <Avatar account={account} size={40} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight text-fg">{displayName}</p>
          <p className="mt-0.5 truncate text-xs text-fg-subtle">@{account.username} · TMDB</p>
        </div>
        <a
          href={`https://www.themoviedb.org/u/${account.username}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Profile on TMDB"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-fg-muted transition-colors hover:border-fg-subtle hover:text-fg"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>

      {/* Your library */}
      <div className="p-1.5">
        <p className="px-3 pt-2 pb-1 text-[0.68rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">Your library</p>
        {libraryShelves.map(({ tab, label, icon: Icon }) => (
          <Link key={tab} href={tab === "watchlist" ? "/library" : `/library?tab=${tab}`} className={row}>
            <Icon className="size-4 text-accent" aria-hidden="true" />
            {label}
            <ChevronRight className="ml-auto size-4 text-fg-subtle" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <form action={signOut} className="border-t border-line p-1.5">
        <button type="submit" className={`${row} w-full hover:bg-danger/10 hover:text-danger`}>
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </form>
    </div>
  );
}
