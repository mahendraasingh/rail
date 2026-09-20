# Task History

## Existing Project Snapshot

### Purpose
Initial AI-readable snapshot of the existing RailTogether codebase to establish baseline project memory for future agent interactions without rescanning unchanged files.

### Current State
- Complete full-stack MVP implemented with verified builds.
- Frontend: 11 pages and 14 reusable components with Tailwind CSS styling and responsive layouts.
- Backend: Express REST API with 5 routers, 4 controllers, 4 Mongoose models, and matching/seat/dataset domain services.
- Data Layer: MongoDB schema design with active fallback support.
- Dataset Architecture: `server/dataset/uploads/` directory initialized with `.gitkeep` and connected to `datasetService.js`.

### Important Existing Areas
1. **Seat & Coach Modeling** (`seatUtils.js`, `seatService.js`, `SeatMap.jsx`, `SeatCard.jsx`).
2. **Deterministic Matching Engine** (`matchingUtils.js`, `matchingService.js`, `MatchCard.jsx`, `Recommendations.jsx`).
3. **Voluntary Swap Lifecycle** (`swapController.js`, `swapRoutes.js`, `SwapRequestCard.jsx`, `SwapRequests.jsx`).
4. **Journey & Passenger Management** (`journeyController.js`, `passengerController.js`, `JourneyDetails.jsx`, `CreateJourney.jsx`).
5. **Authentication & Session** (`authController.js`, `authMiddleware.js`, `AuthContext.jsx`, `Login.jsx`, `Register.jsx`).
6. **Dataset Ingestion Scaffold** (`datasetService.js`, `datasetRoutes.js`, `server/dataset/uploads/`).
