import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/session";
import { profileUrl } from "@/lib/tmdb/images";
import { AccountMenu } from "./AccountMenu";

// Server Component: reads the session cookie and decides what to show.
// The Header wraps it in <Suspense>, because reading cookies is per-request:
// the rest of the page stays instant (prerendered), and only this small
// corner of the header waits for "who is this?".

export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm" })}>
        Sign in
      </Link>
    );
  }

  return <AccountMenu username={user.username} name={user.name} avatarUrl={profileUrl(user.avatarPath, "w45")} />;
}

/** Same size as the real thing, shown while the session is being checked. */
export function UserMenuFallback() {
  return <div className="h-8 w-[4.5rem] rounded-sm bg-surface" aria-hidden="true" />;
}
