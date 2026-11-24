<p align="center">
  <img src="public/brand/marquee-logo.png" alt="Marquee" width="320" />
</p>

<p align="center"><strong>Find your next screening.</strong><br/>
A film and TV discovery app designed like a festival programme, built on Next.js 16 and the TMDB API.</p>

<p align="center"><a href="https://marquee-ashen.vercel.app/">Live site →</a></p>

---

## Highlights

- **Festival Program design.** Serif display type, brass accents, ticket-stub details, a rotating hero spotlight and a closing-credits footer. It does not copy any streaming service's look.
- **Fast by default.** Partial prerendering serves a static shell instantly. Data streams into Suspense boundaries, and TMDB responses are cached with `"use cache"` and `cacheLife`.
- **Modal detail views.** Intercepting and parallel routes open a title as a modal over the home page. The same URL opens as a full page when loaded directly.
- **Personal library.** Sign in with TMDB to use the watchlist, favorites and ratings. All data is stored on TMDB, so there is no database to run.
- **Instant buttons.** Library buttons update immediately and send one request after a short pause (latest wins), so double clicks and changes of mind are handled correctly.
- **Search and Discover.** The URL holds the state, so pages are shareable and the back button works. Search runs live as you type, a ⌘K command palette is available everywhere, and Discover has filters with infinite scroll.
- **Accessible and responsive.** Skip link, focus management, screen-reader announcements and reduced-motion support. Phones and tablets get a drawer navigation.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components, partial prefetching) |
| UI | React 19 (Server Components, Server Actions, `useOptimistic`, `<ViewTransition>`) |
| Styling | Tailwind CSS v4 (`@theme` tokens), Fraunces + Hanken Grotesk via `next/font` |
| Motion | Motion (`motion/react`), CSS keyframes, View Transitions |
| Primitives | Radix Dialog & Dropdown Menu, cmdk, lucide-react icons |
| Data | TMDB REST API v3, server-only client |
| Hosting | Vercel |

## Getting started

```bash
git clone https://github.com/mehtab-ali-khan/marquee.git
cd marquee
npm install
cp .env.example .env.local   # then add your TMDB "API Read Access Token"
npm run dev
```

Then open http://localhost:3000.

| Variable | Required | Purpose |
|---|---|---|
| `TMDB_READ_TOKEN` | yes | TMDB v4 read access token, used only on the server. |
| `NEXT_PUBLIC_SITE_URL` | no | Public URL for share cards. Defaults to Vercel's production URL. |

Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`.
`node scripts/brand-assets.mjs` regenerates every logo, icon and share image from `public/brand/marquee-logo-sheet.png`.

## Architecture

```
TMDB API ──► src/lib        data layer: server-only, cached, typed
                │
                ▼
             src/app        routes: pages, layouts, API routes, metadata
                ▲
   built from   │
   src/features  (UI for one area: home, title, library, discover, search, auth)
   src/components (shared UI: layout, ui primitives, media cards)
```

**Rule of thumb:** `lib` holds data and logic with no UI. `components` holds reusable pieces. `features` holds UI that belongs to one area. `app` decides which URL shows what.

### Request flow (e.g. `/movie/438631`)

1. Vercel serves the prerendered shell (header, layout, skeletons) immediately.
2. `movie/[id]/page.tsx` calls `getMovie()`, which either hits the cache or makes **one** TMDB request with `append_to_response`.
3. `features/title/program.ts` turns the film into the shared `Program` shape, and `TitleProgram` renders it on the server.
4. Only the interactive parts (chapter bar, trailer dialog, library buttons) ship JavaScript.
5. The signed-in user's saved state streams in separately, so the rest of the page never waits for it.

### Authentication

TMDB's three-step flow: request token → user approves on TMDB → `/auth/callback` exchanges it for a session.
The session ID is stored in an **httpOnly, SameSite=Lax, Secure** cookie (`marquee_session`). The TMDB token never reaches the browser: `lib/tmdb/client.ts` imports `server-only`.
Return paths are validated (`safeReturnPath`) so the login flow can't be used as an open redirect.

## Project structure

```
src/
├─ app/                         Routes (each folder = a URL segment)
│  ├─ layout.tsx                Root shell: fonts, header, footer, metadataBase
│  ├─ template.tsx              Per-navigation page transitions
│  ├─ globals.css               Theme tokens + custom CSS (tickets, hero, drawer…)
│  ├─ (browse)/                 Home (route group: not in the URL)
│  │  └─ @modal/(.)title/…      Parallel + intercepting route: title opens as a modal
│  ├─ title/{movie,tv}/[id]     Direct visit to a modal URL → redirect to full page
│  ├─ movie/[id], tv/[id]       Full "Festival Program" detail pages (+ loading.tsx)
│  ├─ person/[id]               Person page and filmography
│  ├─ search, discover          URL-driven search and filtered browsing
│  ├─ library                   Signed-in shelves (watchlist, favorites, rated)
│  ├─ login, auth/callback      Sign-in page and TMDB callback route handler
│  ├─ api/…                     JSON route handlers: search, discover, preview,
│  │                            library pages, TV seasons
│  ├─ styleguide                Internal design reference (noindex)
│  └─ icon / favicon / opengraph-image / manifest.ts   Metadata file conventions
│
├─ features/                    Area-specific UI
│  ├─ home/                     Rows, hover previews, detail modal
│  ├─ title/                    Detail page parts, chapter nav, cast strip
│  ├─ library/                  Library view, title buttons, Server Action
│  ├─ discover/                 Filter deck, infinite grid
│  ├─ search/                   Live search box
│  └─ auth/                     signIn/signOut Server Actions, submit button
│
├─ components/                  Shared UI
│  ├─ layout/                   Header, nav, mobile drawer, ⌘K palette, user menu, footer
│  ├─ media/                    Hero, cards, rails, trailer, watch providers, episodes
│  └─ ui/                       Button, Container, Logo, PageHeader, Skeleton, Badge…
│
└─ lib/
   ├─ tmdb/                     client (auth header, errors, 1 retry), per-resource
   │                            fetchers (movies, tv, people, search, discover,
   │                            trending, library, auth), mappers & image URLs
   ├─ auth/session.ts           Session cookie, cached getCurrentUser, safe redirects
   └─ utils.ts                  cn() class merging
```

## Notable decisions

- **No global state library.** The server holds the data (Server Components + cache), the URL holds view state (search, filters, pages), and small local state lives in components. After a write, `revalidatePath("/library")` makes Next.js fetch fresh data, which replaces a client-side store refetch.
- **Latest-wins save queue** (`features/library/TitleLibraryControls.tsx`). Each click updates the button immediately, and the request waits 350 ms for clicking to stop. If the final value equals the saved value, nothing is sent. If the user changes their mind while a request is in flight, the newest value is sent next. On failure, only the affected button reverts.
- **One `Program` shape** for films and series. The detail layout is written once and used for both.
- **Plain cache keys.** Cached functions take only primitive arguments, and per-user data is never cached.
- **Single retry on network failure** for GET requests only, so a brief network blip doesn't break a page, and writes are never repeated.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data is provided by JustWatch via TMDB.
