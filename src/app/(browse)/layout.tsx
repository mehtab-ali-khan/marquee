// Layout for the "browse" area (the home page). Folders in (parentheses) are
// ROUTE GROUPS: they organize files without adding to the URL, so this is
// still "/".
//
// It has a second slot, `modal` (the @modal folder), a PARALLEL ROUTE: Next
// renders it next to the page. Normally it's empty (default.tsx). When you open
// a title from here, the link to /title/movie/550 is INTERCEPTED by
// @modal/(.)title/movie/[id], so the detail modal opens OVER the home page
// instead of leaving it. Reload or share that URL and app/title/movie/[id]
// redirects to the full /movie/550 page instead.

export default function BrowseLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
