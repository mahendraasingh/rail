# Current State

## Overall Status
**Fully Functional Full-Stack MVP (Active & Running on Localhost)**.
- **Frontend**: `http://localhost:5173/` (Vite) — source in `frontend/`
- **Backend API**: `http://localhost:5000/` (Express.js, connected to MongoDB) — source in `backend/`

## Already Implemented

- **Authentication & User Profiles**:
  - Registration (`POST /api/auth/register`) with bcrypt password hashing.
  - Login (`POST /api/auth/login`) with JWT token generation and storage.
  - Profile endpoint (`GET /api/auth/me`) and Profile diagnostic view (`/profile`).
  - (1-Click demo login/`/api/auth/demo` has been removed.)

- **Journey & Group Passenger Management**:
  - Journey creation (`POST /api/journeys`) with route and coach attributes.
  - Dynamic passenger list addition with automatic berth determination (`Lower`, `Middle`, `Upper`, `Side Lower`, `Side Upper`).
  - Journey details view (`/journey/:id`) with group split status banners.
  - (Demo journey seeding `/api/journeys/demo-seed` has been removed.)

- **Seat Map & Visualization**:
  - 72-berth 3AC/Sleeper coach model divided into 9 compartment bays.
  - Color-coded categories: Group Member (Emerald), Separated Member (Rose), Recommended Swap (Amber), Other (Slate), Empty (Dashed).
  - Split analysis is PER GROUP (`analyzeGroupSplits` in `seatUtils.js`): each group clusters around its own bay, so members of one group never mark members of another group as separated. Result: green-dominant seat maps (~57-65 green, 1-11 red per coach).
  - Amber RECOMMENDED markers appear on the BEST target seat per separated passenger (occupied seats included — the occupant is the swap opportunity); red separated seats keep their color.
  - Selected seat inspection drawer and direct swap request trigger from map.

- **Deterministic Matching Engine**:
  - PER-GROUP cluster bay identification: a passenger is "separated" only relative to their own group's bay.
  - Swap candidates = solo travellers AND willing members of OTHER groups (`isAvailableForSwap !== false`); never the requester's own group; same coach only.
  - Multi-factor scoring (Coach: 30, Berth: 20, Proximity: 30, Target willingness: 10, Age/Category: 10).
  - "Why this match?" explainability generation. Typical journeys produce 50-500 recommendations.

- **Voluntary Swap Request Flow**:
  - Swap creation (`POST /api/swaps`) with PENDING status.
  - Swap response management: Accept (`POST /api/swaps/:id/accept`), Reject (`POST /api/swaps/:id/reject`), Cancel (`POST /api/swaps/:id/cancel`).
  - Atomic seat number and berth exchange upon acceptance in application state.
  - Multi-perspective tabs (Received / Sent) for demonstration.

- **Synthetic Dataset Integration**:
  - Generator script (`backend/dataset/generate_dataset.py`) & Validation suite (`backend/dataset/validate_dataset.py`) integrated.
  - Complete synthetic railway dataset in `backend/dataset/uploads/` (180 journeys, 30 trains, 70 stations, 12,000 bookings, 35,100 passengers, 32,985 active seat assignments, 103 test scenario labels).
  - Dataset status checking (`GET /api/dataset/status`), dataset parsing (`POST /api/dataset/load`), and dataset seeding (`POST /api/dataset/seed`).
  - Auto-seeding: first `GET /api/journeys` (or journey detail/seatmap) seeds all 180 dataset journeys + passengers into MongoDB (or in-memory fallback) when dataset journeys are absent (checked via `createdBy: 'synthetic_dataset_importer'`, NOT an empty-collection check). Bulk `insertMany` in 1,000-doc chunks.
  - Dataset parse cache in `datasetService.js` keyed by uploads folder file mtimes, so the 50k+ CSV rows parse once per dataset version, not per request.
  - Dataset distribution (tuned): 80% GROUP_TOGETHER bookings; `willing_to_exchange` = TRUE for ~80% of confirmed passengers. Per journey: passengers fill the journey's default coach first (e.g. B2 72, B1 72, B3 remainder, few in SL/2A/CC).
  - Legacy demo purge: on first request after boot, journeys with `_id` starting `demo_journey_` or `createdBy` starting `demo_user` (and their passengers/swaps) are deleted from DB and memory. This fixed the `Cast to ObjectId failed for value "demo_journey_..."` error.

## Currently Existing Functionality
- Dataset-driven flow: Landing -> Login/Register -> Dashboard (180 dataset journeys listed) -> Journey Details / Seat Map / Recommendations -> Request Swap -> Accept Swap -> Updated Arrangement.
- Full CRUD operations on journeys and passengers.
- Resilient execution with or without a running MongoDB instance.
- Fully populated synthetic dataset auto-loaded on first journeys request.

## UI Notes
- Navbar top links: New Journey, Exchange Requests, Notifications (the Dashboard link was removed per user request; Dashboard is reached after login/register).
- Landing CTA row has a single "Create New Journey" button (the "Explore Journeys & Dataset" button was removed).
- All demo entry points removed from UI: Landing explore button, CreateJourney "Auto-fill Demo Split Data" button, Navbar demo launch handler, demo login services.

## Pending / TODO
- No explicit unresolved `TODO` comments in the codebase.
- Future expansion points (documented in roadmap): real-time WebSocket notifications, multi-coach class layouts (2AC, 1AC, CC), QR verification.

## Known Issues
- None currently blocking execution or compilation. Production Vite build produces 0 errors.

## Important Notes
- The application explicitly disclaims official railway ticketing authority on all user-facing pages.
- When creating or modifying swap logic, ensure atomic updates preserve both `seatNumber` and `berthType` fields simultaneously.
- Directory structure uses `frontend/` (React/Vite) and `backend/` (Express/Node) instead of the previous `client/` and `server/` names.
