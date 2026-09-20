# Project Context

## Project Name
**RailTogether** (Package names: `railtogether-root`, `railtogether-client`, `railtogether-server`)

## Project Purpose
RailTogether is an assistive voluntary railway seat-exchange coordinator designed to solve the seat-splitting problem for groups, families, and senior citizens travelling together on Indian Railways. When group members are assigned seats across different bays or coaches, RailTogether detects the separation, visualizes the coach layout, calculates deterministic compatibility scores with fellow solo passengers, and facilitates human-consent-based voluntary seat swaps without modifying official railway reservation systems.

## Current Tech Stack
- **Frontend**: React 18.3.1, Vite 6.0.11, Tailwind CSS 3.4.17, React Router DOM 6.28.2, Axios 1.7.9, Lucide React 0.474.0, clsx 2.1.1, **GSAP** (animations via `lib/motion.jsx`), **Three.js** (lazy landing hero only)
- **Backend**: Node.js (v24 compatible), Express.js 4.21.2, Mongoose 8.9.5, jsonwebtoken 9.0.2, bcryptjs 2.4.3, cors 2.8.5, dotenv 16.4.7
- **Database**: MongoDB with Mongoose ODM (includes an automated in-memory store fallback when MongoDB is not connected)
- **Authentication**: JWT Bearer token authentication (1-Click Hackathon Demo mode removed)
- **Styling**: Tailwind CSS with the RailSaathi railway design system — warm ivory/cream backgrounds, graphite `ink` text, `crimson` railway-red primary, `saffron` gold secondary, `steel` supporting (NO blue SaaS palette); legacy `rail.*` classes alias to crimson. Fonts: Fraunces (display), Inter (body), IBM Plex Mono (seat/PNR numerals). Signature CSS motifs: `.paper-texture`, `.ink-band`, `.metallic-rule`, `.perforation`, `.platform-label`.
- **Brand**: **RailSaathi** — "Booked Together. Sit Together." Primary navigation: Dashboard / Groups / Matches / Requests.
- **Architecture**: Decoupled Client-Server Monorepo (`frontend/`, `backend/`, root orchestrator)

## Existing Features

1. **Group Split Detection**:
   - **What it does**: Computes coach compartment bay assignments (8 berths per bay in 72-berth standard 3AC/Sleeper layout) and detects separation PER GROUP — each group is clustered around its own bay (`analyzeGroupSplits`); members of one group never mark members of another group as separated.
   - **Implementation**: [`backend/utils/seatUtils.js`](file:///d:/rail/backend/utils/seatUtils.js), [`frontend/src/utils/seatUtils.js`](file:///d:/rail/frontend/src/utils/seatUtils.js).

2. **Deterministic Compatibility Match Scoring**:
   - **What it does**: Evaluates potential seat exchanges between separated group members and eligible targets (solo travellers AND willing members of other groups) using a transparent 100-point scoring algorithm (Same Coach: +30, Same Berth Type: +20, Proximity Gain: +30, Target Willingness/Independence: +10, Age/Berth Eligibility: +10) with explicit explainability reasons ("Why this match?").
   - **Implementation**: [`backend/services/matchingService.js`](file:///d:/rail/backend/services/matchingService.js), [`backend/utils/matchingUtils.js`](file:///d:/rail/backend/utils/matchingUtils.js).

3. **Interactive Coach Seat Map**:
   - **What it does**: Renders a 72-seat coach layout divided into 9 bays with Main Cabin (6 berths), Aisle, and Side Cabin (2 berths), annotated with color markers (Group, Separated, Recommended swap, Other passenger) and seat inspector drawer.
   - **Implementation**: [`frontend/src/components/SeatMap.jsx`](file:///d:/rail/frontend/src/components/SeatMap.jsx), [`frontend/src/components/SeatCard.jsx`](file:///d:/rail/frontend/src/components/SeatCard.jsx), [`backend/services/seatService.js`](file:///d:/rail/backend/services/seatService.js).

4. **Voluntary Seat Exchange Coordination**:
   - **What it does**: Allows passengers to send exchange requests, review incoming requests, and accept/reject. Upon mutual acceptance, seat records are atomically exchanged in the application journey state.
   - **Implementation**: [`backend/controllers/swapController.js`](file:///d:/rail/backend/controllers/swapController.js), [`frontend/src/pages/SwapRequests.jsx`](file:///d:/rail/frontend/src/pages/SwapRequests.jsx), [`frontend/src/components/SwapRequestCard.jsx`](file:///d:/rail/frontend/src/components/SwapRequestCard.jsx).

5. **Plug-and-Play Dataset Architecture**:
   - **What it does**: Detects, validates, parses (with mtime-keyed cache) and auto-seeds synthetic CSV/JSON railway datasets from `backend/dataset/uploads/` on first journeys request. All 180 dataset journeys appear on the Dashboard.
   - **Implementation**: [`backend/services/datasetService.js`](file:///d:/rail/backend/services/datasetService.js), [`backend/routes/datasetRoutes.js`](file:///d:/rail/backend/routes/datasetRoutes.js), `ensureDatasetLoaded`/`purgeLegacyDemoData` in [`backend/controllers/journeyController.js`](file:///d:/rail/backend/controllers/journeyController.js).

## Important Files

- [`package.json`](file:///d:/rail/package.json): Root orchestrator for multi-package scripts (`npm run dev`, `npm run install:all`).
- [`backend/server.js`](file:///d:/rail/backend/server.js): Express server entry point mounting auth, journey, passenger, swap, and dataset routes.
- [`backend/config/db.js`](file:///d:/rail/backend/config/db.js): Mongoose connection with resilient fallback.
- [`backend/services/matchingService.js`](file:///d:/rail/backend/services/matchingService.js): Core matching and ranking engine.
- [`backend/services/datasetService.js`](file:///d:/rail/backend/services/datasetService.js): Synthetic dataset parser and normalizer.
- [`frontend/src/App.jsx`](file:///d:/rail/frontend/src/App.jsx): Client route configuration and AuthProvider wrapping.
- [`frontend/src/services/api.js`](file:///d:/rail/frontend/src/services/api.js): Configured Axios instance with request/response interceptors.

## Important Folders

- [`frontend/src/components/`](file:///d:/rail/frontend/src/components/): Primitives (`Navbar`, `Button`, `Card`/`SectionLabel`, `Badge`, `Modal`, `LoadingScreen`, `PageTransition`, `Footer`) and railway widgets (`CoachViz`, `SeatMap`, `GroupTicket`, `RouteMap`, `MatchCard`, `SwapRequestCard`, `JourneySummary`, `HeroScene`/`HeroScene3D`).
- [`frontend/src/pages/`](file:///d:/rail/frontend/src/pages/): Route views (`Landing`, `Login`, `Register`, `Dashboard`, `Groups`, `GroupDetail`, `Matches`, `Requests`, `JourneyDetails`, `SeatMapPage`, `CreateJourney`, `Notifications`, `Profile`).
- [`frontend/src/utils/groupUtils.js`](file:///d:/rail/frontend/src/utils/groupUtils.js): shared API-shape contract helpers (extractGroups, buildSeatClusters, getSeparatedSeatNumbers) — journey detail has NO `seatMapData` (call `getSeatMap` separately); per-group entries live at `groupSplitInfo.perGroup[]`.
- [`backend/models/`](file:///d:/rail/backend/models/): Mongoose schemas (`User`, `Journey`, `Passenger`, `SwapRequest`).
- [`backend/dataset/uploads/`](file:///d:/rail/backend/dataset/uploads/): Upload directory for synthetic railway datasets.

## Important Constraints

1. **No Direct Railway API / IRCTC Scrapers**: The application operates strictly with synthetic/simulated data and manual passenger entries.
2. **Voluntary Human Consent Only**: The system never forces or automatically alters official railway ticket reservations; all actions represent assistive journey planning agreements.
3. **Dataset Directory State**: `backend/dataset/uploads/` contains the full generated synthetic dataset (14 CSVs + summary). Do not treat it as empty; deleting these files disables dataset auto-seeding.
4. **No Demo Mode**: All 1-Click demo entry points (UI buttons, `/api/journeys/demo-seed`, `/api/auth/demo`) were removed by user request. Do not reintroduce them.
5. **Mixed/String IDs**: `_id` and reference fields on `Journey`/`Passenger`/`SwapRequest` are `Mixed` (dataset uses string IDs like `J000001`); never cast these paths to `ObjectId`, and guard `findById` with `ObjectId.isValid`.
6. **Per-Group Analysis & Dataset Tuning**: Split analysis is always per `groupId` — never feed multiple groups into single-group `analyzeGroupSplit`. Dataset targets: ~80% GROUP_TOGETHER bookings, ~80% `willing_to_exchange`; seat maps are green-dominant with amber best-target markers.
7. **Premium Railway Design System**: UI stays on the ivory/ink/crimson/saffron/steel palette — never reintroduce blue/generic SaaS styling or the old `rail`-blue values. GSAP hooks in `lib/motion.jsx` must keep `prefers-reduced-motion` support; Three.js stays confined to the landing hero (lazy, DPR-capped, disposed, SVG fallback).
8. **Superseded Components Deleted**: `pages/Recommendations.jsx`, `components/Sidebar.jsx`, `components/PassengerCard.jsx` were removed — Matches/JourneyDetails/GroupDetail cover their roles. Do not re-import them.
