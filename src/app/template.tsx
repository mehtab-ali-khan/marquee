import { ViewTransition } from "react";

// Special file: like a layout, but it REMOUNTS on every navigation
// (the layout stays mounted). That makes it the right place for page
// transitions:
//   exit  = the old page leaving  (it unmounts)  → class "page-exit"
//   enter = the new page arriving (it mounts)    → class "page-enter"
//   default="none" = no animation for anything else, e.g. Suspense sections
//   streaming in while you stay on the same page.
// The animations themselves are in globals.css.

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
