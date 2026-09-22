# Current State

## Overall Status
**Premium Redesigned Full-Stack App (Active & Running on Localhost)**
- **Frontend**: `http://localhost:5173/` (Vite) — source in `frontend/`
- **Backend API**: `http://localhost:5000/` (Express.js, connected to inline MongoDB) — source in `backend/`

## Dark Mode (latest addition)
- `ThemeContext` (`context/ThemeContext.jsx`) + `useTheme` hook; theme persisted in
  localStorage `railtogether_theme`, defaults to system `prefers-color-scheme`.
- Toggle icon (Sun/Moon) in Navbar top corner, desktop actions row AND mobile menu row.
- `darkMode: 'class'` in `tailwind.config.js`; `dark:` variants on app shell, Navbar,
  `index.html` body, `index.css` (scrollbar, `.glass-panel`).
- Pre-hydration script in `index.html` applies persisted theme before first paint (no FOUC).
- **WHOLE-APP dark via CSS remap layer** in `index.css` (`@layer components`, `.dark :is(*)`
  + `&.utility` nesting): re-maps every light utility actually used (bg-white, bg-slate-*,
  text-slate-*, colored 50/100/200 tints, borders, form controls, placeholders, hovers)
  to dark equivalents. Avoid annotating every JSX file with dark: variants.
- EXCLUDED from remap (intentional dark-on-dark): text-slate-200/300/950, bg-slate-700+,
  gradient from/to/via stops, border-white (used on ink hero band), bg-slate-400 Badge dot.
- KNOWN PRE-EXISTING ISSUE (not dark-mode related): many components use `crimson-*`,
  `saffron-*`, `steel-*`, `ivory`, `ink`, `line`, `paper` classes that are NOT defined in
  `tailwind.config.js` (only rail/navy/berth are) — verified they generate no CSS. UI was
  built against the RailSaathi design-system tokens, but the config only ships the older
  rail/navy palette; those classes silently do nothing in light mode too.
- VERIFIED via headless Edge CDP click test: html.dark flips, body/header/card/input
  colors change, persists across reload, un-toggle restores exact light values.
  NOTE: restart Vite dev server after changing tailwind config (dark: compiled per start).

## Design System (Railway Premium — NO blue SaaS)
- **Palette** (`frontend/tailwind.config.js`): `ivory`/`cream` backgrounds, `ink` (deep graphite) text,
  `crimson` (deep railway red) primary accent, `saffron` (muted gold) secondary, `steel` supporting,
  `line` hairline borders. Legacy `rail.*` classes aliased to crimson so no stale class renders blue.
- **Typography**: Fraunces (display serif, `font-display`), Inter (body), IBM Plex Mono (`font-mono`
  for seat numbers / PNRs / ticket serials). Loaded in `frontend/index.html`.
- **Signature CSS** (`frontend/src/index.css`): `.paper-texture`, `.ink-band`, `.metallic-rule`,
  `.perforation`, `.ticket-edge`, `.platform-label` (station-style overline).
- **Brand**: **RailSaathi** — "BOOKED TOGETHER. SIT TOGETHER."

## Frontend Architecture
- **New deps**: `gsap` (animations), `three` (3D hero). Both lazy-loaded via `frontend/src/lib/motion.jsx`
  (useGsap / useReveal / useScrollReveal / loadThree, all respect `prefers-reduced-motion`).
- **Contexts**: `AuthContext` (auth) + `JourneyContext` (`context/JourneyContext.jsx` — active journey
  for the navbar selector, persists to localStorage `railsaathi_journey`).
- **App shell** (`App.jsx`): LoadingScreen boot sequence → Navbar → `PageTransition` wrapped routes →
  Footer. Route guard redirects by token presence (`railtogether_token`). `/swaps` redirects to `/requests`.
- **Navbar**: shrink-on-scroll (h-16→h-14, blur, hairline border), links = Dashboard/Groups/Matches/Requests,
  right side = journey selector (`NDLS → MMCT` codes) + profile/logout.

## Pages (all live)
| Route | Page | Notes |
|---|---|---|
| `/` | Landing | Three.js hero (`HeroScene3D.jsx`: track, train, fog, scroll response, DPR-capped, full disposal) with SVG fallback on mobile/reduced-motion/no-WebGL; How-It-Works 5-station timeline (Detect→Match→Request→Confirm→Coordinate); product rules grid |
| `/dashboard` | Dashboard | Hero "YOUR JOURNEY, COORDINATED.", 4 live stat cards (Groups/Separated/Matches/Requests from API), CoachViz, group status ticket (View Coach + Find Match), journey grid with mini RouteMap |
| `/journeys` | Journeys | Dedicated browsable train list (search by train/station/PNR, ticket cards → View Journey / Find Matches / Seat Map); separate from Create Journey form |
| `/groups` | Groups | All groups as railway-ticket cards (perforation, serials, TOGETHER/SEPARATED stub) with ALL/SEPARATED/TOGETHER filters |
| `/groups/:groupId` | GroupDetail | Ticket header, route timeline, CoachViz with cluster lines, passengers list, coordination panel (matches count, View Matches) |
| `/matches` + `/journey/:id/recommendations` | Matches | "POTENTIAL MATCHES" cards (score, why-this-match checklist, Send Request); split-screen comparison modal (Your Group ⇄ Potential Passenger + POTENTIAL EXCHANGE marker) → "Request Passenger Consent" |
| `/requests` | Requests | Received/Sent tabs; SwapRequestCard with animated route-line states (PENDING=shuttle dot, ACCEPTED=fill sweep, REJECTED=fade, CANCELLED=retract) |
| `/journey/:id` | JourneyDetails | JourneySummary (ink band + dark RouteMap), action rail, CoachViz, coordination panel, group member rows |
| `/journey/:id/seats` | SeatMapPage | Full SeatMap + inspector drawer + top matches + consent modal |
| `/login`, `/register` | Auth | Split editorial layout (ink side panel + form column) |
| `/journey/create`, `/notifications`, `/profile` | Utility | Restyled to ivory/ticket system |

## Key Components
- `CoachViz.jsx` — linear bay strip with GSAP-animated SVG connection lines between separated seat
  clusters of the focused group; seat states focus/separated/match/selected/idle.
- `GroupTicket.jsx` — ticket (full) and mini (list row) variants; fake serial `RS-0001` is decorative.
- `RouteMap.jsx` — route line with `dark` tone prop for use on ink surfaces.
- `MatchCard.jsx`, `SwapRequestCard.jsx` — redesigned (compat checklist; animated status line).
- Primitives restyled: Button, Card(+SectionLabel), Badge, Modal, LoadingSpinner, EmptyState.

## Data-Shape Contract (API → UI)
- Journey detail `GET /api/journeys/:id` returns `{ journey, passengers, groupPassengers, groupSplitInfo, recommendationCount, swaps }` — **no seatMapData**; fetch `getSeatMap(id)` separately (returns `{ journey, seatMap: { bays, coach, ... }, groupSplitInfo }`).
- `groupSplitInfo.perGroup[]` = per-group entries `{ groupId, isSplit, separatedPassengerIds, clusterBay, ... }`.
- `frontend/src/utils/groupUtils.js` = shared contract helpers: `extractGroups(detail)`,
  `getPerGroupSplitInfos`, `findGroupSplitInfo`, `getSeparatedSeatNumbers(group)`,
  `buildSeatClusters(seats)` (adjacent-bay clustering ≤4 seats apart for CoachViz lines).
- Matches payload: `recommendations[]` = `{ requester{ id, name, coach, seatNumber, berthType }, target{...}, matchScore, whyReasons[], breakdown }` (no bringsCloser used).

## Journey Entry Split (latest)
- Two SEPARATE entries now: **My Journeys** (`/journeys` — browsable train list page `pages/Journeys.jsx` with search) and **New Journey** (`/journey/create` — full train + members form). Navbar links: My Journeys / New Journey / Exchange Requests / Notifications; Dashboard banner has "Browse All Journeys" + "Create New Journey".
- Note: `pages/Recommendations.jsx` still EXISTS and is routed (`/journey/:id/recommendations`) — earlier "deleted" memory note was wrong; source of truth wins.

## Removed (superseded)
- `pages/Recommendations.jsx`, `components/Sidebar.jsx`, `components/PassengerCard.jsx` deleted —
  Matches/JourneyDetails cover their roles. Do not re-import them.
- All demo entry points remain removed (UI, `/api/journeys/demo-seed`, `/api/auth/demo`).

## Known Issues
- None blocking. Production build passes; Three.js chunk (~747 kB) is lazy-loaded only on
  desktop landing (acceptable for demo; could be manualChunks-tuned later).

## Backend (unchanged this pass)
Dataset auto-seed (180 journeys), purge of legacy demo docs, per-group split analysis, matcher
(willing group members as targets), dataset parse cache — all as previously documented. MongoDB connected.
