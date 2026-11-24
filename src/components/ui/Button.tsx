import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Note: no "use client" here. This component has no state or effects, so it
// works in both Server and Client Components. It becomes a client component
// automatically when a client component imports it (e.g. to pass onClick).

const variants = {
  // The one loud button on a screen ("Watch trailer", "Sign in").
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  // Everyday actions ("Add to watchlist").
  secondary: "bg-raised text-fg border border-line hover:border-fg-subtle",
  // Low-emphasis actions in toolbars and menus.
  ghost: "text-fg-muted hover:text-fg hover:bg-raised",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "size-10", // square, for icon-only buttons
} as const;

type ButtonStyleOptions = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

/**
 * Returns the button's class string. Exported separately so a <Link> can
 * LOOK like a button while staying a real link (correct semantics for
 * navigation, and right-click "open in new tab" still works):
 *
 *   <Link href="/discover" className={buttonStyles({ variant: "secondary" })}>
 */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    // shared base: layout, shape, motion, disabled state
    "inline-flex shrink-0 items-center justify-center rounded-sm font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,transform] duration-150 ease-out-soft",
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & Omit<ButtonStyleOptions, "className">;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  // type="button" by default: a plain <button> inside a <form> would
  // otherwise SUBMIT the form, a classic bug.
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
