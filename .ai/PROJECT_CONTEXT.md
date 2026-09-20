# Project Context

## Project Name
**RailTogether** (Package names: `railtogether-root`, `railtogether-client`, `railtogether-server`)

## Project Purpose
RailTogether is an assistive voluntary railway seat-exchange coordinator designed to solve the seat-splitting problem for groups, families, and senior citizens travelling together on Indian Railways. When group members are assigned seats across different bays or coaches, RailTogether detects the separation, visualizes the coach layout, calculates deterministic compatibility scores with fellow solo passengers, and facilitates human-consent-based voluntary seat swaps without modifying official railway reservation systems.

## Current Tech Stack
- **Frontend**: React 18.3.1, Vite 6.0.11, Tailwind CSS 3.4.17, React Router DOM 6.28.2, Axios 1.7.9, Lucide React 0.474.0, clsx 2.1.1
- **Backend**: Node.js (v24 compatible), Express.js 4.21.2, Mongoose 8.9.5, jsonwebtoken 9.0.2, bcryptjs 2.4.3, cors 2.8.5, dotenv 16.4.7
- **Database**: MongoDB with Mongoose ODM (includes an automated in-memory store fallback when MongoDB is not connected)
- **Authentication**: JWT Bearer token authentication + 1-Click Hackathon Demo mode
- **Styling**: Tailwind CSS with custom railway design tokens, Plus Jakarta Sans typography, and custom micro-animations
- **Architecture**: Decoupled Client-Server Monorepo (`client/`, `server/`, root orchestrator)

## Existing Features

1. **Group Split Detection**:
   - **What it does**: Computes coach compartment bay assignments (8 berths per bay in 72-berth standard 3AC/Sleeper layout) and calculates bay span to detect when group members are separated across different compartments.
   - **Implementation**: [`server/utils/seatUtils.js`](file:///d:/rail/server/utils/seatUtils.js), [`client/src/utils/seatUtils.js`](file:///d:/rail/client/src/utils/seatUtils.js).

2. **Deterministic Compatibility Match Scoring**:
   - **What it does**: Evaluates potential seat exchanges between separated group members and eligible solo passengers using a transparent 100-point scoring algorithm (Same Coach: +30, Same Berth Type: +20, Proximity Gain: +30, Solo Passenger: +10, Age/Berth Eligibility: +10) with explicit explainability reasons ("Why this match?").
   - **Implementation**: [`server/services/matchingService.js`](file:///d:/rail/server/services/matchingService.js), [`server/utils/matchingUtils.js`](file:///d:/rail/server/utils/matchingUtils.js).

3. **Interactive Coach Seat Map**:
   - **What it does**: Renders a 72-seat coach layout divided into 9 bays with Main Cabin (6 berths), Aisle, and Side Cabin (2 berths), annotated with color markers (Group, Separated, Recommended swap, Other passenger) and seat inspector drawer.
   - **Implementation**: [`client/src/components/SeatMap.jsx`](file:///d:/rail/client/src/components/SeatMap.jsx), [`client/src/components/SeatCard.jsx`](file:///d:/rail/client/src/components/SeatCard.jsx), [`server/services/seatService.js`](file:///d:/rail/server/services/seatService.js).

4. **Voluntary Seat Exchange Coordination**:
   - **What it does**: Allows passengers to send exchange requests, review incoming requests, and accept/reject. Upon mutual acceptance, seat records are atomically exchanged in the application journey state.
   - **Implementation**: [`server/controllers/swapController.js`](file:///d:/rail/server/controllers/swapController.js), [`client/src/pages/SwapRequests.jsx`](file:///d:/rail/client/src/pages/SwapRequests.jsx), [`client/src/components/SwapRequestCard.jsx`](file:///d:/rail/client/src/components/SwapRequestCard.jsx).

5. **1-Click Hackathon Demo Mode**:
   - **What it does**: Instantly seeds and logs into the 12011 Kalka Shatabdi Express scenario with 4 split family members (B2-31, 32, 57, 58) and 3 candidate passengers (B2-45, 46, 60).
   - **Implementation**: [`server/controllers/journeyController.js`](file:///d:/rail/server/controllers/journeyController.js#L14-L115), [`client/src/components/Navbar.jsx`](file:///d:/rail/client/src/components/Navbar.jsx).

6. **Plug-and-Play Dataset Architecture**:
   - **What it does**: Detects and validates synthetic CSV/JSON railway datasets uploaded to `server/dataset/uploads/`. Falls back gracefully with status messaging when empty.
   - **Implementation**: [`server/services/datasetService.js`](file:///d:/rail/server/services/datasetService.js), [`server/routes/datasetRoutes.js`](file:///d:/rail/server/routes/datasetRoutes.js).

## Important Files

- [`package.json`](file:///d:/rail/package.json): Root orchestrator for multi-package scripts (`npm run dev`, `npm run install:all`).
- [`server/server.js`](file:///d:/rail/server/server.js): Express server entry point mounting auth, journey, passenger, swap, and dataset routes.
- [`server/config/db.js`](file:///d:/rail/server/config/db.js): Mongoose connection with resilient fallback.
- [`server/services/matchingService.js`](file:///d:/rail/server/services/matchingService.js): Core matching and ranking engine.
- [`server/services/datasetService.js`](file:///d:/rail/server/services/datasetService.js): Synthetic dataset parser and normalizer.
- [`client/src/App.jsx`](file:///d:/rail/client/src/App.jsx): Client route configuration and AuthProvider wrapping.
- [`client/src/services/api.js`](file:///d:/rail/client/src/services/api.js): Configured Axios instance with request/response interceptors.

## Important Folders

- [`client/src/components/`](file:///d:/rail/client/src/components/): Reusable UI primitives and domain widgets (`SeatMap`, `MatchCard`, `SwapRequestCard`, `JourneySummary`, `Modal`, `Navbar`).
- [`client/src/pages/`](file:///d:/rail/client/src/pages/): Route views (`Landing`, `Dashboard`, `CreateJourney`, `JourneyDetails`, `SeatMapPage`, `Recommendations`, `SwapRequests`, `Notifications`, `Profile`).
- [`server/models/`](file:///d:/rail/server/models/): Mongoose schemas (`User`, `Journey`, `Passenger`, `SwapRequest`).
- [`server/dataset/uploads/`](file:///d:/rail/server/dataset/uploads/): Upload directory for synthetic railway datasets.

## Important Constraints

1. **No Direct Railway API / IRCTC Scrapers**: The application operates strictly with synthetic/simulated data and manual passenger entries.
2. **Voluntary Human Consent Only**: The system never forces or automatically alters official railway ticket reservations; all actions represent assistive journey planning agreements.
3. **Empty Dataset Upload Directory**: `server/dataset/uploads/` is maintained with only `.gitkeep` until synthetic data files are provided by the user.
