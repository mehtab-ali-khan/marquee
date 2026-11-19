// Turns TMDB's image paths into real image URLs.
//
// TMDB never sends a full image URL. It sends a path:
//   poster_path: "/1E5baAaEse26fej7uHcjOgEE2t2.jpg"
// and we build the URL ourselves:
//   https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg
//                               ^^^^ size we choose
//
// No "server-only" here: this is a plain function with no secrets
// (image URLs are public), so client components can use it too.

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// The sizes TMDB offers for each kind of image. Typing them means a
// typo like "w501" is caught by TypeScript instead of giving a broken image.
export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";
export type BackdropSize = "w300" | "w780" | "w1280" | "original";
export type ProfileSize = "w45" | "w185" | "h632" | "original";

function buildUrl(path: string | null, size: string): string | null {
  // No path = TMDB has no image. Return null so the UI shows a placeholder.
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function posterUrl(path: string | null, size: PosterSize = "w342") {
  return buildUrl(path, size);
}

export function backdropUrl(path: string | null, size: BackdropSize = "w1280") {
  return buildUrl(path, size);
}

export function profileUrl(path: string | null, size: ProfileSize = "w185") {
  return buildUrl(path, size);
}

export type LogoSize = "w45" | "w92" | "w154" | "w185" | "w300" | "w500" | "original";

/** Logos of streaming services and studios. */
export function logoUrl(path: string | null, size: LogoSize = "w92") {
  return buildUrl(path, size);
}
