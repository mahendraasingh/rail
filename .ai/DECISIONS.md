# Technical Decisions

## [Frontend] - Railway Premium Design System + GSAP/Three.js (Upgrade, Not Rebuild)

### Decision
Restyled the existing React app in place (kept all pages, services, AuthContext, API wiring) rather
than rebuilding. Palette: warm ivory/cream backgrounds, deep graphite `ink` text, deep railway red
`crimson` primary, muted `saffron` gold secondary, `steel` supporting — no blue. Legacy `rail.*`
classes alias to crimson so old markup can never render blue. Fraunces (display) + Inter (body) +
IBM Plex Mono (seat/PNR numerals). GSAP is lazy-loaded through `lib/motion.jsx` hooks that all
respect `prefers-reduced-motion`; Three.js powers only the landing hero (lazy chunk, devicePixelRatio
cap 1.75, full geometry/material disposal, SVG fallback for mobile/reduced-motion/no-WebGL).

### Evidence
[`frontend/tailwind.config.js`](file:///d:/rail/frontend/tailwind.config.js),
[`frontend/src/lib/motion.jsx`](file:///d:/rail/frontend/src/lib/motion.jsx),
[`frontend/src/components/HeroScene3D.jsx`](file:///d:/rail/frontend/src/components/HeroScene3D.jsx),
[`frontend/src/components/CoachViz.jsx`](file:///d:/rail/frontend/src/components/CoachViz.jsx).

### Impact
All backend connections preserved (Dashboard stats, matches, swaps, dataset all read live API data;
no fake frontend data). New IA = Dashboard / Groups / Matches / Requests; Matches also serves
`/journey/:id/recommendations`. Old Recommendations.jsx/Sidebar.jsx/PassengerCard.jsx deleted.
Three.js ships as a separate lazy chunk (747 kB min / 192 kB gzip) loaded only on desktop landing.

---

## [Frontend] - Centralized API-Shape Helpers (groupUtils.js)

### Decision
Group/split rendering is derived from the real API shapes through one module:
`extractGroups(detail)`, `getPerGroupSplitInfos`, `findGroupSplitInfo`, `getSeparatedSeatNumbers`,
`buildSeatClusters`. Established contract: journey detail does NOT include seat map data (call
`getSeatMap` separately); per-group split entries live at `groupSplitInfo.perGroup[]` with
`{ groupId, isSplit, separatedPassengerIds[], clusterBay, ... }`.

### Evidence
[`frontend/src/utils/groupUtils.js`](file:///d:/rail/frontend/src/utils/groupUtils.js), verified
against live `GET /api/journeys/:id` and `/seatmap` payloads.

### Impact
Dashboard/Groups/GroupDetail/JourneyDetails share one source of truth for group derivation and
cluster visualization instead of four divergent inline implementations (two of which referenced
fields that don't exist in the API).

---

## [Matching] - Per-Group Split Analysis + Group Members as Valid Swap Targets

### Decision
Group split analysis is performed per `groupId` (`analyzeGroupSplits` in `backend/utils/seatUtils.js`), aggregating each group's own cluster bay — never across groups. The matching engine (`backend/services/matchingService.js`) computes separation relative to the requester's OWN group bay and accepts as swap candidates both solo travellers AND willing members of other groups (`isAvailableForSwap !== false`, same coach, never the requester's own group, never already-separated members). Seat map amber RECOMMENDED markers show only the best-scoring target per separated passenger and may render on occupied seats; red separated seats always keep their color.

### Evidence
[`backend/utils/seatUtils.js`](file:///d:/rail/backend/utils/seatUtils.js), [`backend/services/matchingService.js`](file:///d:/rail/backend/services/matchingService.js), [`backend/utils/matchingUtils.js`](file:///d:/rail/backend/utils/matchingUtils.js), [`backend/services/seatService.js`](file:///d:/rail/backend/services/seatService.js).

### Impact
Fixes "everyone red except 1-2 rows" (whole coach treated as one group) and "zero recommendations" (solo-only targets). Dataset retuned to 80% GROUP_TOGETHER and 80% willing_to_exchange so maps are green-dominant with realistic amber opportunities (verified 62/4/4 green/red/amber on J000001). All changes visible on the frontend without frontend edits (additive `groupSplitInfo` fields).

---

## [Dataset] - Remove 1-Click Demo Everywhere; Auto-Seed via Presence Check with Legacy-Doc Purge

### Decision
Removed the entire 1-Click demo feature (UI buttons, `/api/journeys/demo-seed`, `/api/auth/demo`, frontend demo services/context) per user request, including the Navbar "Dashboard" top-row link and the Landing "Explore Journeys & Dataset" button. Dataset auto-seeding in `ensureDatasetLoaded` now checks `countDocuments({ createdBy: 'synthetic_dataset_importer' }) === 0` instead of an empty journeys collection, purges legacy demo docs (string `_id`s like `demo_journey_*`) once per boot, and inserts via chunked `insertMany` (1,000 docs). `datasetService.loadDataset()` results are cached keyed by uploads-folder file mtimes.

### Evidence
[`backend/controllers/journeyController.js`](file:///d:/rail/backend/controllers/journeyController.js), [`backend/services/datasetService.js`](file:///d:/rail/backend/services/datasetService.js), frontend `Landing.jsx` / `Navbar.jsx` / `CreateJourney.jsx` / services.

### Impact
Fixed the reported `Cast to ObjectId failed for value "demo_journey_..."` error (stale string-`_id` demo doc blocked both lookups and seeding) and made all 180 dataset journeys appear on the Dashboard without manual seeding. Live-verified: 180 journeys returned, 0 demo IDs, clean 404 for demo IDs.

---

## [Dataset] - Deterministic Synthetic Dataset Generator & Relational CSV Schema

### Decision
Integrated Python-based deterministic synthetic dataset generator (`generate_dataset.py`) and validator (`validate_dataset.py`) using fixed seed (`404404`). The generated dataset produces 14 normalized CSV files covering trains, stations, routes, scheduled trips, coaches, seat layouts, bookings, passengers, groups, seat assignments, preferences, eligibility, and test scenarios.

### Evidence
Located in [`backend/dataset/generate_dataset.py`](file:///d:/rail/backend/dataset/generate_dataset.py), [`backend/dataset/validate_dataset.py`](file:///d:/rail/backend/dataset/validate_dataset.py), and outputs in [`backend/dataset/uploads/`](file:///d:/rail/backend/dataset/uploads/).

### Impact
Enables high-scale testing across 180 journeys and 35,100 passengers while guaranteeing reproducible test fixtures (e.g. Primary Demo Delhi-Chandigarh Shatabdi scenario).

---

## [Restructure] - Rename `client/` → `frontend/` and `server/` → `backend/`

### Decision
Renamed the two main project directories from `client/`/`server/` to `frontend/`/`backend/` for clearer naming convention. All source code, node_modules, config files, and build artifacts were moved. Root `package.json` scripts updated accordingly.

### Evidence
Visible in updated [`package.json`](file:///d:/rail/package.json), [`frontend/package.json`](file:///d:/rail/frontend/package.json), and [`backend/package.json`](file:///d:/rail/backend/package.json).

### Impact
All root scripts (`npm run dev`, `npm run install:all`, etc.) now reference `frontend/` and `backend/`. No internal source code changes were needed — only the top-level directory names and the root orchestrator script changed.

---

## [Initial Architecture] - Monorepo Structure with Decoupled Client and Server

### Decision
The project is organized as a monorepo with distinct `frontend/` and `backend/` root directories, unified by root `package.json` scripts.

### Evidence
Visible in [`package.json`](file:///d:/rail/package.json), [`frontend/package.json`](file:///d:/rail/frontend/package.json), and [`backend/package.json`](file:///d:/rail/backend/package.json).

### Impact
Affects build scripts, deployment, and developer workflow.

---

## [Initial Architecture] - Deterministic Scoring Algorithm over Opaque ML/AI

### Decision
Voluntary seat matches are ranked using a transparent 100-point deterministic mathematical formula (Coach: +30, Berth: +20, Proximity: +30, Solo: +10, Compatibility: +10) with human-readable explanations.

### Evidence
Implemented in [`backend/services/matchingService.js`](file:///d:/rail/backend/services/matchingService.js) and [`backend/utils/matchingUtils.js`](file:///d:/rail/backend/utils/matchingUtils.js).

### Impact
Ensures transparent explainability for users and judges without non-deterministic hallucinations.

---

## [Initial Architecture] - Resilient In-Memory Fallback alongside MongoDB

### Decision
Database controllers support both live MongoDB via Mongoose and an automatic In-Memory data store fallback if MongoDB is not reachable.

### Evidence
Implemented in [`backend/config/db.js`](file:///d:/rail/backend/config/db.js), [`backend/controllers/journeyController.js`](file:///d:/rail/backend/controllers/journeyController.js), and [`backend/controllers/swapController.js`](file:///d:/rail/backend/controllers/swapController.js).

### Impact
Allows the application to run smoothly in testing and hackathon judging environments without requiring a local database setup.

---

## [Initial Architecture] - Standard 72-Berth Coach Bay Model

### Decision
Coach seat mapping and group split detection is modeled on Indian Railways standard 72-berth 3AC/Sleeper coaches (8 berths per compartment bay).

### Evidence
Implemented in [`backend/utils/seatUtils.js`](file:///d:/rail/backend/utils/seatUtils.js) and [`frontend/src/utils/seatUtils.js`](file:///d:/rail/frontend/src/utils/seatUtils.js).

### Impact
Governs berth type calculations (`(seat % 8)` formula) and bay span calculations across all coach visualizers.

---

## [Initial Architecture] - Isolated Synthetic Dataset Folder

### Decision
The `backend/dataset/uploads/` directory is reserved for user-supplied synthetic railway datasets and initialized with only `.gitkeep`, accompanied by a dataset parsing service with graceful fallback.

### Evidence
Visible in [`backend/dataset/uploads/.gitkeep`](file:///d:/rail/backend/dataset/uploads/.gitkeep), [`backend/dataset/README.md`](file:///d:/rail/backend/dataset/README.md), and [`backend/services/datasetService.js`](file:///d:/rail/backend/services/datasetService.js).

### Impact
Allows synthetic data integration later without altering application models or API architecture.
