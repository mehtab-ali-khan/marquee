"use client";
// Must be a Client Component: it needs a button that runs code (retry),
// and React error boundaries only work in the browser part of React.

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

// Special file name: if any page crashes (e.g. TMDB is down), Next shows this
// INSTEAD of a blank screen. Like a React error boundary you didn't have to write.
// Header and footer stay visible; only the broken page content is replaced.

type ErrorPageProps = {
  error: unknown;
  retry: () => void; // re-fetches and re-renders the page that failed
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    // Shows up in the browser console. In a real product this is where
    // you'd send the error to a monitoring service (e.g. Sentry).
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center py-24">
      <Container className="max-w-2xl text-center">
        <h1 className="text-3xl">Something went wrong.</h1>
        <p className="mt-3 text-fg-muted">
          We couldn’t load this page. It might be a hiccup on our side or at TMDB.
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={() => retry()}>Try again</Button>
        </div>
      </Container>
    </main>
  );
}
