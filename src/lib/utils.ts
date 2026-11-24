import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names safely.
 *
 * clsx:     lets us write conditional classes -> cn("a", isActive && "b")
 * twMerge:  resolves Tailwind conflicts so the LAST one wins ->
 *           cn("px-4", "px-6") === "px-6"  (without it, both would apply
 *           and the winner depends on CSS order, not on what you wrote)
 *
 * This is what lets a component accept `className` from its parent and
 * have the parent's classes override the defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
