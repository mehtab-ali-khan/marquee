"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getSessionId } from "@/lib/auth/session";
import { saveTitleState } from "@/lib/tmdb/library";

export async function updateLibrary(type: unknown, id: unknown, field: unknown, value: unknown) {
  if ((type !== "movie" && type !== "tv") || typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return { error: "That title is invalid." };
  }

  let change: Parameters<typeof saveTitleState>[3];
  if ((field === "watchlist" || field === "favorite") && typeof value === "boolean") {
    change = { field, value };
  } else if (field === "rating" && typeof value === "number" && value >= 0 && value <= 10 && Number.isInteger(value * 2)) {
    change = { field, value };
  } else {
    return { error: "That library change is invalid." };
  }

  try {
    const [user, sessionId] = await Promise.all([getCurrentUser(), getSessionId()]);
    if (!user || !sessionId) return { error: "Please sign in to save changes." };
    await saveTitleState({ accountId: user.id, sessionId }, type, id, change);
  } catch {
    return { error: "Couldn’t save your change. Try again." };
  }

  // Refresh the library page's data. The detail page is NOT revalidated: its
  // buttons already show the confirmed state, and re-reading TMDB immediately
  // could return the old value (TMDB lags a few seconds after a write).
  revalidatePath("/library");
  return { error: null };
}
