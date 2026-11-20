import { Bookmark, Heart, Star } from "lucide-react";

// Shared by the desktop account menu (a Client Component) and the phone menu's
// account section (a Server Component). It lives in a plain module because a
// Server Component can only import COMPONENTS from a "use client" file:
// any other export (like this array) arrives as an unusable client reference.

export type AccountInfo = {
  username: string;
  name: string;
  avatarUrl: string | null;
};

export const libraryShelves = [
  { tab: "watchlist", label: "Watchlist", icon: Bookmark },
  { tab: "favorite", label: "Favorites", icon: Heart },
  { tab: "rated", label: "Rated", icon: Star },
] as const;
