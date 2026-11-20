import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { SubmitButton } from "@/features/auth/SubmitButton";
import { signIn } from "@/features/auth/actions";
import { getCurrentUser, safeReturnPath } from "@/lib/auth/session";
import { posterUrl } from "@/lib/tmdb/images";
import { getTrendingMovies } from "@/lib/tmdb/trending";

// /login: the "members' entrance".
// Left: what signing in gives you, how the TMDB hand-off works, and the ticket
// with the one button. Right (desktop): a slowly moving wall of this week's
// posters. On phones the wall becomes a single sideways "marquee" strip.
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

const STEPS = [
  { title: "Continue with TMDB", body: "We send you to themoviedb.org, where your account lives." },
  { title: "Approve Marquee", body: "Sign in there and allow access. Your password stays with TMDB." },
  { title: "You’re back, signed in", body: "Your watchlist, favorites and ratings come with you." },
];

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="relative isolate flex-1 overflow-hidden">
      {/* Phones/tablets: one sideways poster strip on top. */}
      <PosterStrip />

      <div className="mx-auto grid w-full max-w-page lg:min-h-[calc(100svh-var(--marquee-header-height))] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">Members’ entrance</p>
            <h1 className="mt-4 text-5xl leading-[0.95] sm:text-6xl">
              Your seat is <span className="text-fg-muted italic">waiting.</span>
            </h1>
            <div className="mt-6 h-px w-16 bg-accent" aria-hidden="true" />
            <p className="mt-5 leading-relaxed text-fg-muted">
              Sign in with your free TMDB account to keep a watchlist, collect favorites and rate what you’ve seen.
            </p>

            {/* How the hand-off works: people are less surprised by the redirect when they expect it. */}
            <ol className="mt-8 space-y-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-accent/40 text-xs font-semibold text-accent tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-fg">{step.title}</p>
                    <p className="text-sm text-fg-subtle">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* The ticket: the one action on the page. */}
            <div className="mt-10">
              <div className="ticket-top rounded-t-lg border border-b-0 border-line bg-surface px-6 pt-5 pb-6">
                <div className="flex items-center justify-between text-[0.68rem] font-semibold tracking-[0.2em] text-fg-subtle uppercase">
                  <span>Admit one</span>
                  <span className="flex items-center gap-1.5">
                    <Lock className="size-3" aria-hidden="true" /> Secured by TMDB
                  </span>
                </div>
                {/* Reading searchParams and the session cookie happens per request,
                    so this part streams in behind Suspense. */}
                <Suspense fallback={<div className="mt-5 h-12 rounded-sm bg-raised" />}>
                  {searchParams.then((sp) => (
                    <SignInForm error={first(sp.error)} next={first(sp.next)} />
                  ))}
                </Suspense>
              </div>
              <div className="ticket-bottom rounded-b-lg border border-t-0 border-line bg-surface px-6 pt-5 pb-5">
                <div className="-mt-5 mb-4 border-t border-dashed border-fg-subtle/40" aria-hidden="true" />
                <p className="text-center text-sm text-fg-muted">
                  New to TMDB?{" "}
                  <a
                    href="https://www.themoviedb.org/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-fg underline-offset-4 hover:text-accent hover:underline"
                  >
                    Create a free account <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Desktop: the moving poster wall. */}
        <PosterWall />
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
        <p role="alert" className="mt-5 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {ERRORS[error]}
        </p>
      )}
      {/* action={signIn}: submitting calls the Server Action directly. No
          onSubmit, no fetch. It even works before JavaScript has loaded. */}
      <form action={signIn} className="mt-5">
        <input type="hidden" name="next" value={next} />
        <SubmitButton pendingLabel="Taking you to TMDB…" className="w-full rounded-full">
          Continue with TMDB
        </SubmitButton>
      </form>
    </>
  );
}

/** This week's trending posters, cached: part of the instant static shell. */
async function getPosters() {
  "use cache";
  const { results } = await getTrendingMovies("week");
  return results.filter((m) => m.poster_path).map((m) => posterUrl(m.poster_path, "w342")!);
}

/** Desktop: three columns drifting up and down at different speeds. Decorative. */
async function PosterWall() {
  const posters = await getPosters();
  const columns = [0, 1, 2].map((c) => posters.filter((_, i) => i % 3 === c).slice(0, 6));

  return (
    <div
      aria-hidden="true"
      className="relative hidden overflow-hidden border-l border-line lg:block [mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_85%,transparent)]"
    >
      <div className="absolute inset-0 grid grid-cols-3 gap-4 px-6 opacity-70">
        {columns.map((column, c) => (
          // Each column is its posters TWICE, moved by exactly half its height,
          // so the loop is seamless.
          <div key={c} className={`login-wall-column flex flex-col ${c === 1 ? "login-wall-down" : ""}`} style={{ animationDuration: `${60 + c * 12}s` }}>
            {[...column, ...column].map((src, i) => (
              // mb-4, not gap-4: with gap, "half the track" would be off by half a gap and the loop would jump.
              <div key={i} className="relative mb-4 aspect-[2/3] shrink-0 overflow-hidden rounded-md border border-line">
                <Image src={src} alt="" fill sizes="(min-width: 1440px) 220px, 15vw" loading={i < 3 ? "eager" : "lazy"} className="object-cover" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Warm spill of light from the left edge, like a projector beam. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_50%,rgb(14_15_17/0.85),transparent)]" />
    </div>
  );
}

/** Phones/tablets: one row of posters sliding sideways, like a marquee sign. Decorative. */
async function PosterStrip() {
  const posters = (await getPosters()).slice(0, 10);
  return (
    <div aria-hidden="true" className="overflow-hidden border-b border-line py-4 lg:hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
      <div className="login-strip flex w-max">
        {[...posters, ...posters].map((src, i) => (
          <div key={i} className="relative mr-3 h-36 w-24 shrink-0 overflow-hidden rounded-md border border-line opacity-80 sm:h-44 sm:w-[7.4rem]">
            <Image src={src} alt="" fill sizes="120px" loading={i < 5 ? "eager" : "lazy"} className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
