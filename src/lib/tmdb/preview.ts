// The extra details a hover preview shows, in the small shape the browser needs.
// No "server-only": the client imports the TYPE (the route builds the data).

export type PreviewDetails = {
  facts: string[]; // ["2h 19m"] for a movie, ["5 seasons"] for a show
  genres: string[]; // ["Drama", "Crime"], max 3
  trailerKey: string | null; // YouTube id for the trailer modal
  library: { signedIn: boolean; watchlist: boolean };
};
