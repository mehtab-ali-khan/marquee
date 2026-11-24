import { Suspense } from "react";
import { connection } from "next/server";

// Renders nothing. It tells Next "this page is intentionally rendered per
// request", so a generateMetadata() that reads URL params can STREAM its result
// instead of blocking the page's prefetch. (Next 16 reports a
// "blocking-prerender-metadata-runtime" issue without it; this is the fix from
// the generateMetadata docs.) Inside Suspense, so nothing else waits for it.

async function Connection() {
  await connection();
  return null;
}

export function DynamicMarker() {
  return (
    <Suspense>
      <Connection />
    </Suspense>
  );
}
