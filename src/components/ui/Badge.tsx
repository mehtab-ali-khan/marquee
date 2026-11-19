import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-line text-fg-muted",
  accent: "border-accent/40 text-accent",
  success: "border-success/40 text-success",
} as const;

type BadgeProps = ComponentProps<"span"> & { tone?: keyof typeof tones };

/** Small label for genres, years, certifications ("PG-13"), media type. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium tabular-nums",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
