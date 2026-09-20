# Changelog

## Journey Entry Split — /journeys List Page
- Split journey access into two separate entries per user request: **My Journeys** (new `/journeys` route, `pages/Journeys.jsx`) shows ALL trains as ticket-style cards with search (train/station/PNR) and View Journey / Find Matches / Seat Map actions; **New Journey** (`/journey/create`) keeps the full train + passengers form.
- Navbar now has My Journeys (ListChecks icon) + New Journey entries; Dashboard welcome banner got a "Browse All Journeys" button beside "Create New Journey".
- Verified: `vite build` passes; `/journeys` serves 200.

## Premium Frontend Redesign — RailSaathi (Railway Design System, GSAP + Three.js)
- Rebranded UI to **RailSaathi** ("Booked Together. Sit Together.") with a warm railway palette
  (ivory/ink/crimson/saffron/steel — replaces blue SaaS) in `tailwind.config.js`; legacy `rail.*`
  classes aliased to crimson. Fonts: Fraunces/Inter/IBM Plex Mono.
- Added `gsap` + `three`; new `lib/motion.jsx` (useGsap/useReveal/useScrollReveal/loadThree with
  reduced-motion support), `context/JourneyContext.jsx` (navbar journey selector), `PageTransition`,
  premium `LoadingScreen` boot sequence, `Footer`.
- New pages: **Groups** (ticket cards + filters), **GroupDetail** (timeline + CoachViz + coordination
  panel), **Matches** (split-screen comparison modal + consent flow; serves `/matches` AND
  `/journey/:id/recommendations`), **Requests** (animated status route lines). Landing rebuilt with
  Three.js hero (lazy, DPR-capped, full GPU disposal, SVG fallback) + 5-station How-It-Works +
  product rules. Dashboard rebuilt (hero, live stat cards, CoachViz, group status ticket).
- New components: `CoachViz` (bay strip with GSAP cluster connection lines), `GroupTicket`,
  `RouteMap` (dark mode), `HeroScene`/`HeroScene3D`; restyled primitives + `SeatMap`/`SeatCard`/
  `MatchCard`/`SwapRequestCard`/`JourneySummary`/`Navbar` (shrink-on-scroll + journey selector).
- Added shared API-shape helpers `utils/groupUtils.js` (`extractGroups`, `buildSeatClusters`,
  `getSeparatedSeatNumbers`) after discovering detail endpoint has no `seatMapData` and per-group
  data lives at `groupSplitInfo.perGroup[]`.
- Deleted superseded `pages/Recommendations.jsx`, `components/Sidebar.jsx`, `components/PassengerCard.jsx`.
- Verified: production build passes (three.js lazy chunk), backend 200, frontend 200, seat map
  categories healthy (62 GROUP / 4 RECOMMENDED / 4 SEPARATED / 2 OTHER on J000001).

## Per-Group Split Analysis, Matcher Overhaul & Dataset Retune
- Fixed seat maps showing almost everyone red: `analyzeGroupSplit` was fed ALL groups at once (treating the whole coach as one giant group, so only the dominant bay stayed green). Added `analyzeGroupSplits` (per-group analysis, aggregate result) in `seatUtils.js`; `seatService.js` and `journeyController.js` now use it.
- Fixed zero recommendations: the matcher only accepted SOLO travellers as swap targets (rare in dataset). `matchingService.js` rewritten: per-group cluster bays, candidates = solo travellers + willing members of OTHER groups (never own group, never already-separated members, `isAvailableForSwap !== false`).
- `matchingUtils.js`: target-in-another-willing-group now scores the full +10 (was +4 penalty).
- Dataset retuned in `generate_dataset.py`: 68%→80% GROUP_TOGETHER bookings; `willing_to_exchange` 60%→80%. Regenerated + validator PASSED.
- Seat map amber markers now highlight the BEST target seat per separated passenger (sorted recommendations, first per requester) and can appear on occupied seats (the occupant is the swap opportunity); red separated seats keep their color.
- MongoDB dataset wiped & re-seeded. Verified: J000001 = 62 green / 4 red / 4 amber; J000002 = 57/9/6; J000010 = 70/1/1; recommendationCounts 50-500+ per journey.

## Demo Removal, Dataset Auto-Load & CastError Fix
- Removed all 1-Click Demo entry points: `POST /api/journeys/demo-seed` (+ broken `seedDemoJourney`/`getDemoDataPayload` in `journeyController.js`), `POST /api/auth/demo`, frontend `seedDemoJourney`/`demoLogin` services, `AuthContext.demoLogin`, Navbar demo launch handler, Landing "Explore Journeys & Dataset" button, CreateJourney "Auto-fill Demo Split Data" button.
- Removed the Navbar "Dashboard" top-row link per user request (Dashboard still reachable via login/register redirect).
- Fixed `Cast to ObjectId failed for value "demo_journey_..." (type string)`: `ensureDatasetLoaded` now purges legacy demo docs (`_id` starting `demo_journey_`, `createdBy` starting `demo_user`) from MongoDB + memory once per boot before any lookups.
- Fixed dataset not appearing: seeding condition changed from `Journey.countDocuments() === 0` (blocked by the stale demo doc) to `countDocuments({ createdBy: 'synthetic_dataset_importer' }) === 0`; seeding now uses bulk `insertMany` in 1,000-doc chunks (180 journeys + 35,100 passengers in seconds instead of 35k awaited `create` calls).
- Added parse cache to `datasetService.loadDataset()` keyed by uploads-folder file mtimes (50k+ CSV rows parsed once per dataset version instead of per request).
- Verified live: `GET /api/journeys` returns 180 dataset journeys with 0 stale demo IDs; journey detail + seatmap return 200; stale demo id returns clean 404; `vite build` passes.

## Synthetic Railway Dataset Integration & Generator Suite
- Added `generate_dataset.py` (deterministic synthetic railway dataset generator) and `validate_dataset.py` (1.36M check validation suite) in `backend/dataset/`.
- Generated 14 relational CSV files, `dataset_summary.json`, and `README.md` in `backend/dataset/uploads/` (180 journeys, 30 trains, 70 stations, 12,000 bookings, 35,100 passengers, 32,985 active seat assignments, 103 test scenario labels).
- Enhanced `backend/services/datasetService.js` to parse relational dataset CSVs into normalized journeys, passengers, preferences, and test scenarios.
- Added `/api/dataset/seed` endpoint in `backend/routes/datasetRoutes.js` and `seedDatasetJourneys` in `backend/controllers/journeyController.js` for seeding synthetic data into MongoDB or the in-memory fallback store.

## Directory Restructure: `client/` → `frontend/`, `server/` → `backend/`
- Moved all frontend source files from `client/` to `frontend/` (React, Vite, Tailwind CSS, node_modules, dist).
- Moved all backend source files from `server/` to `backend/` (Express, controllers, models, routes, services, utils, dataset, middleware, node_modules).
- Removed the now-empty `client/` and `server/` directories.
- Updated root `package.json` orchestrator scripts (`install:all`, `server`, `client`, `dev`) to reference `frontend` and `backend`.
- Updated all `.ai/` memory files (`ARCHITECTURE.md`, `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASK_HISTORY.md`) to reflect new paths.

## Local Environment Execution
- Started both Backend (`http://localhost:5000`) and Frontend (`http://localhost:5173`) in development mode with active MongoDB connection.

## Initial Existing-Codebase Snapshot

### Current Implementation
- Full-stack voluntary seat exchange platform (`RailTogether`) implemented.
- Group split detection and deterministic compatibility ranking (+30 Coach, +20 Berth, +30 Proximity, +10 Solo, +10 Compatibility).
- Interactive 72-berth coach seat map with bay compartments, color-coded status badges, and selection inspector.
- End-to-end voluntary swap request lifecycle (creation, pending status, accept with atomic seat exchange, reject, cancel).
- 1-Click Demo Journey seeding (`12011 Shatabdi Express` with 4 split family members and 3 candidate passengers).
- Plug-and-play dataset service with graceful fallback when `backend/dataset/uploads/` is empty.
- JWT authentication with instant demo access.

### Existing Structure
- Root package orchestrating `frontend/` (Vite, React, Tailwind CSS) and `backend/` (Express, Mongoose, MongoDB).
- Decoupled REST API routing with error handling and request authentication.

### Memory System Created
- Persistent AI documentation system established in `.ai/` and root `AGENTS.md` based directly on the existing codebase state.
