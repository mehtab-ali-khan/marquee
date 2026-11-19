import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Placeholder shown while data loads. The caller gives it the SAME size as
 * the real content (e.g. aspect-[2/3] for a poster), so nothing jumps when
 * the data arrives. The shimmer is a moving gradient, defined in globals.css.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-surface",
        "bg-[linear-gradient(90deg,transparent_0%,var(--color-raised)_50%,transparent_100%)] bg-size-[200%_100%] bg-no-repeat",
        className,
      )}
      {...props}
    />
  );
}
