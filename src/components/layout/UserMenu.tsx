import Link from "next/link";
import { ArrowRight, ArrowUpRight, LogOut } from "lucide-react";
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

/** Phones and tablets: the account section at the bottom of the full-screen menu. */
export async function MobileAccount() {
  const account = await getAccount();

  if (!account) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="font-display text-xl">Keep your list.</p>
        <p className="mt-1.5 text-sm text-fg-muted">Sign in with your free TMDB account to save, favorite and rate.</p>
        <Link href="/login" className={buttonStyles({ className: "mt-4 w-full rounded-full" })}>
          Sign in <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const displayName = account.name || account.username;
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="rounded-full p-0.5 ring-1 ring-accent/50">
          <Avatar account={account} size={34} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
          <p className="truncate text-xs text-fg-subtle">@{account.username} · TMDB</p>
        </div>
        <a
          href={`https://www.themoviedb.org/u/${account.username}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Profile on TMDB"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {libraryShelves.map(({ tab, label, icon: Icon }) => (
          <Link
            key={tab}
            href={tab === "watchlist" ? "/library" : `/library?tab=${tab}`}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-canvas/50 text-xs text-fg-muted transition-colors hover:text-fg active:border-accent/50 active:bg-accent/10"
          >
            <Icon className="size-3.5 text-accent" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
      <form action={signOut} className="mt-1">
        <button
          type="submit"
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-sm text-fg-muted transition-colors hover:text-danger active:bg-danger/10"
        >
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </form>
    </div>
  );
}
