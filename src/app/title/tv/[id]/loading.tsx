// Reading params happens per request; this (empty) boundary lets the rest of
// the route prerender while the redirect is decided.
export default function Loading() {
  return null;
}
