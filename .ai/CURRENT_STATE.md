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
  - Demo bypass mode (`POST /api/auth/demo`).

- **Journey & Group Passenger Management**:
  - Journey creation (`POST /api/journeys`) with route and coach attributes.
  - Dynamic passenger list addition with automatic berth determination (`Lower`, `Middle`, `Upper`, `Side Lower`, `Side Upper`).
  - Journey details view (`/journey/:id`) with group split status banners.
  - 1-Click Demo Journey seeding (`POST /api/journeys/demo-seed`).

- **Seat Map & Visualization**:
  - 72-berth 3AC/Sleeper coach model divided into 9 compartment bays.
  - Color-coded categories: Group Member (Emerald), Separated Member (Rose), Recommended Swap (Amber), Other (Slate), Empty (Dashed).
  - Selected seat inspection drawer and direct swap request trigger from map.

- **Deterministic Matching Engine**:
  - Group cluster bay identification and distance calculations.
  - Multi-factor scoring (Coach: 30, Berth: 20, Proximity: 30, Solo: 10, Age/Category: 10).
  - "Why this match?" explainability generation.

- **Voluntary Swap Request Flow**:
  - Swap creation (`POST /api/swaps`) with PENDING status.
  - Swap response management: Accept (`POST /api/swaps/:id/accept`), Reject (`POST /api/swaps/:id/reject`), Cancel (`POST /api/swaps/:id/cancel`).
  - Atomic seat number and berth exchange upon acceptance in application state.
  - Multi-perspective tabs (Received / Sent) for demonstration.

- **Synthetic Dataset Handling**:
  - Dataset status checking (`GET /api/dataset/status`) with graceful message when empty.
  - Dataset parser (`backend/services/datasetService.js`) supporting future CSV and JSON uploads.

## Partially Implemented
- **Synthetic Dataset Uploads**: The loader architecture is fully implemented, but `backend/dataset/uploads/` is kept empty (with `.gitkeep`) pending user dataset upload.

## Currently Existing Functionality
- Complete 15-step demo flow runnable via the UI (*Landing -> Try Demo -> Dashboard -> Split Detection -> Recommendations -> Request Swap -> Accept Swap -> Updated Arrangement*).
- Full CRUD operations on journeys and passengers.
- Resilient execution with or without a running MongoDB instance.

## Pending / TODO
- No explicit unresolved `TODO` comments in the codebase.
- Future expansion points (documented in roadmap): real-time WebSocket notifications, multi-coach class layouts (2AC, 1AC, CC), QR verification.

## Known Issues
- None currently blocking execution or compilation. Production Vite build produces 0 errors.

## Important Notes
- The application explicitly disclaims official railway ticketing authority on all user-facing pages.
- When creating or modifying swap logic, ensure atomic updates preserve both `seatNumber` and `berthType` fields simultaneously.
- Directory structure uses `frontend/` (React/Vite) and `backend/` (Express/Node) instead of the previous `client/` and `server/` names.
