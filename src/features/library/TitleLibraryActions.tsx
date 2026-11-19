import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { getCurrentUser, getSessionId } from "@/lib/auth/session";
import { getTitleState } from "@/lib/tmdb/library";
import { TitleLibraryControls } from "./TitleLibraryControls";

export async function TitleLibraryActions({ type, id }: { type: "movie" | "tv"; id: number }) {
  let state: Awaited<ReturnType<typeof getTitleState>> | null = null;

  try {
    const [user, sessionId] = await Promise.all([getCurrentUser(), getSessionId()]);
    if (user && sessionId) state = await getTitleState(sessionId, type, id);
  } catch {
    return <p className="self-center text-sm text-fg-muted">Library controls are temporarily unavailable.</p>;
  }

  if (state) return <TitleLibraryControls key={`${type}-${id}`} type={type} id={id} initial={state} />;

  return (
    <Link href={`/login?next=/${type}/${id}`} className={buttonStyles({ variant: "secondary" })}>
      Sign in to save
    </Link>
  );
}
