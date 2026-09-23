# Task History

## 2026-09-23 — Remove Landing Train Backdrop
- **Task**: User asked to remove ONLY the train feature added in the last update —
  no other frontend feature, no backend change.
- **Outcome**: Verified via git diff that the last uncommitted change was exactly the
  train backdrop (TrainBackdrop in Landing.jsx + .train-backdrop* CSS in index.css
  + .ai entries). Reverted those 5 files to HEAD (dark-mode state). Landing hero is
  back to the single rail-400/10 glow blob. Verified: no train-backdrop references
  remain, vite build passes, frontend 200, backend healthy.

## 2026-09-23 — Warm Charcoal Dark Palette
- **Task**: User said dark background looked blue and "AI-generated"; wanted warm black.
- **Outcome**: Added `coal` warm ramp to tailwind.config.js; rewired app shell, body,
  navbar, scrollbar, glass-panel, and the entire index.css remap layer from navy/slate/
  gray values to warm charcoal (R≥B). Accent hues kept; saffron focus ring. E2E-verified
  all dark surfaces are warm; persistence and un-toggle still pass; build green.

## 2026-09-23 — Whole-App Dark Mode
- **Task**: User wanted the ENTIRE app in dark mode while toggled, not just the navbar.
- **Approach**: Rather than annotating ~44 JSX files with dark: variants, added a CSS
  remap layer in `index.css`: `.dark :is(*) { &.bg-white {...} &.text-slate-500 {...} ... }`
  covering every light utility found via grep inventory (bgs, texts, borders, hovers,
  form controls, placeholders). Dark-on-dark surfaces (ink band, dark buttons) excluded.
- **Verified**: headless Edge CDP E2E click test — cards, inputs, navbar, body all flip;
  persistence across reload; un-toggle restores light. vite build passes.

## 2026-09-23 — Dark Mode "Not Working" Diagnosis
- **Task**: User reported the dark/light toggle not responding to clicks.
- **Root cause**: Both dev servers were down (5173 + 5000 refused connections) — user was
  clicking in a stale tab from a finished Vite session; code itself was correct.
- **Verification**: Headless-browser (Edge CDP) click test confirmed: click flips `html.dark`,
  localStorage `railtogether_theme` light→dark, body bg `rgb(248,250,252)`→`rgb(6,9,17)`,
  header bg → navy-900/90. Note: Tailwind compiles `dark:` variants per server start —
  changing `darkMode` config requires a dev-server restart.
- **Outcome**: No code changes; servers restarted and healthy. Diagnostic script deleted.

## 2026-09-23 — Dark Mode Toggle in Navbar
- **Task**: User asked for an icon-type toggle on the top corner to switch to dark mode.
- **Outcome**: Theme infrastructure added (class-based dark mode, ThemeContext + useTheme,
  localStorage + system-preference default, pre-paint script in index.html). Sun/Moon
  icon toggle placed in the Navbar top corner for both desktop and mobile. Navbar, app
  shell, body, and scrollbar/glass-panel styles adapted. Build verified.

## 2026-09-21 — Journey Entry Split
- User wanted two separate things: (1) a form-only Create Journey flow, (2) a browsable train list. Added `pages/Journeys.jsx` + `/journeys` route, split Navbar links (My Journeys / New Journey), added Dashboard "Browse All Journeys" button. Build verified. Also corrected stale memory: `pages/Recommendations.jsx` still exists and is routed.

## Premium Frontend Redesign (RailSaathi Railway Design System)
- **Task**: Upgrade the entire frontend experience — premium railway palette (no blue SaaS), GSAP
  micro-interactions, restrained Three.js landing hero, new Dashboard/Groups/Matches/Requests IA —
  without breaking functionality or replacing API data with fake data.
- **Outcome**: Full redesign shipped. Design tokens in `tailwind.config.js` (ivory/ink/crimson/
  saffron/steel + `rail` alias); Fraunces/Inter/IBM Plex Mono fonts; `.paper-texture`/`.ink-band`/
  `.metallic-rule`/`.perforation`/`.platform-label` CSS motifs; `lib/motion.jsx` (GSAP hooks with
  reduced-motion); `JourneyContext`; LoadingScreen boot; PageTransition; Footer; shrink-on-scroll
  Navbar with journey selector; CoachViz (animated split-cluster lines); GroupTicket; RouteMap;
  redesigned MatchCard/SwapRequestCard (animated status lines); split-screen consent modal in
  Matches. New pages Groups/GroupDetail/Matches/Requests; rebuilt Landing (Three.js hero +
  How-It-Works + product rules) and Dashboard. Deleted Recommendations.jsx/Sidebar.jsx/
  PassengerCard.jsx. Fixed against real API shapes via `utils/groupUtils.js` (detail endpoint has
  no `seatMapData`; per-group entries at `groupSplitInfo.perGroup[]`). Verified: vite build passes,
  backend healthy, 180 dataset journeys, seat map healthy (62/4/4/2), all routes wired.

## Per-Group Split Analysis & Green-Dominant Seat Maps
- **Task**: User reported seat maps showing only 1-2 green rows with the rest red, and zero green swap recommendations; asked to retune the dataset (more together-groups, more willing-to-exchange passengers) and make results visible on the frontend.
- **Root cause**: (a) All analysis call sites passed every group into `analyzeGroupSplit` as one blob — the entire coach was treated as a single group, so only the dominant bay stayed green. (b) The matcher only accepted solo travellers as swap targets; solos are rare, so recommendations were ~0. (c) Amber markers only rendered on empty seats, but swap targets are occupied.
- **Outcome**: `analyzeGroupSplits` (per-group) added to `seatUtils.js` and used in `seatService`/`journeyController`; `matchingService.js` rewritten (per-group cluster bays, willing members of other groups eligible as targets); `matchingUtils.js` group-target penalty removed; dataset retuned to 80% GROUP_TOGETHER + 80% willing, regenerated, validator PASSED, MongoDB re-seeded. Seat maps now green-dominant (e.g. 62/4/4), amber best-target markers visible, 50-500 recommendations per journey. `.ai` updated in the same pass.

## Demo Removal, CastError Fix & Dataset Auto-Load
- **Task**: Fix `Cast to ObjectId failed for value "demo_journey_1789901065024"` shown on localhost, make the synthetic dataset journeys visible on the site, remove the explore/demo buttons everywhere and the Navbar "Dashboard" top-row link.
- **Root cause**: A stale MongoDB Journey doc with string `_id: demo_journey_...` (left by the old demo seed) both (a) broke ObjectId-cast lookups and (b) blocked dataset auto-seeding, which only ran when the journeys collection was completely empty.
- **Outcome**: Legacy demo docs auto-purged (DB + memory) on first request; seeding re-keyed to `createdBy: 'synthetic_dataset_importer'` with chunked `insertMany`; `datasetService` parse cache added; demo endpoints (`/api/journeys/demo-seed`, `/api/auth/demo`) and all frontend demo UI/services removed; Navbar Dashboard link and Landing explore button removed. Verified live on localhost:5000 — 180 dataset journeys returned, 0 demo IDs, detail/seatmap 200, clean 404 for demo ids, frontend build passes.

## Synthetic Railway Dataset Integration
- **Task**: Integrate synthetic railway dataset generator (`generate_dataset.py`) and validator (`validate_dataset.py`) into codebase and parse/seed relational CSV data into application.
- **Outcome**: Placed generator and validator scripts in `backend/dataset/`. Generated and validated 14 relational CSV files in `backend/dataset/uploads/` (180 journeys, 35,100 passengers, 32,985 confirmed seat assignments, 103 test scenario labels). Updated `datasetService.js`, `journeyController.js`, and `datasetRoutes.js` to parse relational data and expose `/api/dataset/seed` for seeding dataset journeys into active application state. Passed 1.36 million validation checks.

## Directory Restructure: `client/` → `frontend/`, `server/` → `backend/`
- **Task**: Rename and relocate project directories from `client/`/`server/` to `frontend/`/`backend/`.
- **Outcome**: Successfully moved all frontend files to `frontend/` and all backend files to `backend/`. Removed old empty directories. Updated root `package.json` scripts and all `.ai/` documentation. No source code modifications required — only directory structure and orchestration scripts changed.

## Localhost Environment Execution
- **Task**: Run RailTogether client and server on localhost.
- **Outcome**: Successfully spawned both client (Vite on port 5173) and server (Express on port 5000 with MongoDB connected). Verified backend health endpoint (`/api/health`).

## Existing Project Snapshot

### Purpose
Initial AI-readable snapshot of the existing RailTogether codebase to establish baseline project memory for future agent interactions without rescanning unchanged files.

### Current State
- Complete full-stack MVP implemented with verified builds.
- Frontend: 11 pages and 14 reusable components with Tailwind CSS styling and responsive layouts.
- Backend: Express REST API with 5 routers, 4 controllers, 4 Mongoose models, and matching/seat/dataset domain services.
- Data Layer: MongoDB schema design with active fallback support.
- Dataset Architecture: `backend/dataset/uploads/` directory populated with synthetic dataset files.

### Important Existing Areas
1. **Seat & Coach Modeling** (`seatUtils.js`, `seatService.js`, `SeatMap.jsx`, `SeatCard.jsx`).
2. **Deterministic Matching Engine** (`matchingUtils.js`, `matchingService.js`, `MatchCard.jsx`, `Recommendations.jsx`).
3. **Voluntary Swap Lifecycle** (`swapController.js`, `swapRoutes.js`, `SwapRequestCard.jsx`, `SwapRequests.jsx`).
4. **Journey & Passenger Management** (`journeyController.js`, `passengerController.js`, `JourneyDetails.jsx`, `CreateJourney.jsx`).
5. **Authentication & Session** (`authController.js`, `authMiddleware.js`, `AuthContext.jsx`, `Login.jsx`, `Register.jsx`).
6. **Dataset Ingestion Scaffold** (`datasetService.js`, `datasetRoutes.js`, `backend/dataset/uploads/`).
