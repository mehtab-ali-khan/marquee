import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { SubmitButton } from "@/features/auth/SubmitButton";
import { signIn } from "@/features/auth/actions";
import { getCurrentUser, safeReturnPath } from "@/lib/auth/session";
import { posterUrl } from "@/lib/tmdb/images";
import { getTrendingMovies } from "@/lib/tmdb/trending";

// /login: a minimal centered card over a blurred mosaic of trending posters.
//
// "Signup" in Marquee: TMDB owns the accounts (like "Sign in with Google").
// New users create a free account on themoviedb.org, then come back and sign in.
// We never see or store anyone's password.

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  denied: "You didn’t approve the request on TMDB, so you’re not signed in.",
  failed: "That sign-in link expired or was already used. Please try again.",
  unavailable: "TMDB isn’t responding right now. Please try again in a moment.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
      {/* Cached posters: part of the instant static shell. */}
      <PosterMosaic />

      <div className="w-full max-w-md rounded-lg border border-line bg-raised/90 p-8 shadow-2xl backdrop-blur-md md:p-10">
        <p className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />
          <span className="font-display text-xl">Marquee</span>
        </p>
        <h1 className="mt-6 text-3xl">Sign in to keep your list</h1>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          Marquee uses your free TMDB account. Your watchlist, favorites and ratings stay in sync with
          themoviedb.org.
        </p>

        <ul className="mt-6 space-y-2 text-sm text-fg-muted">
          {["Save titles to your watchlist", "Mark favorites and rate what you’ve seen", "We never see your password"].map(
            (item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 text-accent" aria-hidden="true" /> {item}
              </li>
            ),
          )}
        </ul>

        {/* Reading searchParams and the session cookie happens per request,
            so this part streams in behind Suspense. */}
        <Suspense fallback={<div className="mt-8 h-12 rounded-sm bg-surface" />}>
          {searchParams.then((sp) => (
            <SignInForm error={first(sp.error)} next={first(sp.next)} />
          ))}
        </Suspense>

        <p className="mt-6 text-center text-sm text-fg-muted">
          New to TMDB?{" "}
          <a
            href="https://www.themoviedb.org/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-fg underline-offset-2 hover:text-accent hover:underline"
          >
            Create a free account <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </p>
      </div>
    </main>
  );
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

async function SignInForm({ error, next }: { error: string; next: string }) {
  // Already signed in? Skip the login page.
  if (await getCurrentUser()) redirect(safeReturnPath(next));

  return (
    <>
      {ERRORS[error] && (
        <p role="alert" className="mt-6 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {ERRORS[error]}
        </p>
      )}

      {/* action={signIn}: submitting calls the Server Action directly. No
          onSubmit, no fetch. It even works before JavaScript has loaded. */}
      <form action={signIn} className="mt-8">
        <input type="hidden" name="next" value={next} />
        <SubmitButton pendingLabel="Taking you to TMDB…" className="w-full">
          Continue with TMDB
        </SubmitButton>
      </form>
    </>
  );
}

/** Decorative blurred grid of trending posters behind the card. */
async function PosterMosaic() {
  "use cache";
  const { results } = await getTrendingMovies("week");
  const posters = results.filter((m) => m.poster_path).slice(0, 18);

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <div className="grid h-full grid-cols-6 gap-2 opacity-40 blur-sm md:grid-cols-9">
        {posters.map((movie) => (
          <div key={movie.id} className="relative aspect-[2/3]">
            <Image src={posterUrl(movie.poster_path, "w185")!} alt="" fill sizes="12vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/60 via-canvas/80 to-canvas" />
    </div>
  );
}
