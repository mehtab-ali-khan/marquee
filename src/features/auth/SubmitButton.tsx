"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// A submit button that knows when its form is busy.
// useFormStatus() reads the state of the <form> this button sits in: while the
// Server Action runs, `pending` is true, so we disable the button (no double
// clicks) and show a spinner. No useState needed.

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
};

export function SubmitButton({ children, pendingLabel, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} aria-disabled={pending} className={className}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
