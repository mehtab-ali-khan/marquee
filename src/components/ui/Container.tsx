import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Centers page content with a max width and consistent side gutters
 * (16px mobile, 24px tablet, 48px desktop). Every page uses this, so
 * edges line up across the whole app.
 */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-page px-4 md:px-6 lg:px-12", className)} {...props} />
  );
}
