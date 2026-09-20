# Technical Decisions

## [Initial Architecture] - Monorepo Structure with Decoupled Client and Server

### Decision
The project is organized as a monorepo with distinct `client/` and `server/` root directories, unified by root `package.json` scripts.

### Evidence
Visible in [`package.json`](file:///d:/rail/package.json), [`client/package.json`](file:///d:/rail/client/package.json), and [`server/package.json`](file:///d:/rail/server/package.json).

### Impact
Affects build scripts, deployment, and developer workflow.

---

## [Initial Architecture] - Deterministic Scoring Algorithm over Opaque ML/AI

### Decision
Voluntary seat matches are ranked using a transparent 100-point deterministic mathematical formula (Coach: +30, Berth: +20, Proximity: +30, Solo: +10, Compatibility: +10) with human-readable explanations.

### Evidence
Implemented in [`server/services/matchingService.js`](file:///d:/rail/server/services/matchingService.js) and [`server/utils/matchingUtils.js`](file:///d:/rail/server/utils/matchingUtils.js).

### Impact
Ensures transparent explainability for users and judges without non-deterministic hallucinations.

---

## [Initial Architecture] - Resilient In-Memory Fallback alongside MongoDB

### Decision
Database controllers support both live MongoDB via Mongoose and an automatic In-Memory data store fallback if MongoDB is not reachable.

### Evidence
Implemented in [`server/config/db.js`](file:///d:/rail/server/config/db.js), [`server/controllers/journeyController.js`](file:///d:/rail/server/controllers/journeyController.js), and [`server/controllers/swapController.js`](file:///d:/rail/server/controllers/swapController.js).

### Impact
Allows the application to run smoothly in testing and hackathon judging environments without requiring a local database setup.

---

## [Initial Architecture] - Standard 72-Berth Coach Bay Model

### Decision
Coach seat mapping and group split detection is modeled on Indian Railways standard 72-berth 3AC/Sleeper coaches (8 berths per compartment bay).

### Evidence
Implemented in [`server/utils/seatUtils.js`](file:///d:/rail/server/utils/seatUtils.js) and [`client/src/utils/seatUtils.js`](file:///d:/rail/client/src/utils/seatUtils.js).

### Impact
Governs berth type calculations (`(seat % 8)` formula) and bay span calculations across all coach visualizers.

---

## [Initial Architecture] - Isolated Synthetic Dataset Folder

### Decision
The `server/dataset/uploads/` directory is reserved for user-supplied synthetic railway datasets and initialized with only `.gitkeep`, accompanied by a dataset parsing service with graceful fallback.

### Evidence
Visible in [`server/dataset/uploads/.gitkeep`](file:///d:/rail/server/dataset/uploads/.gitkeep), [`server/dataset/README.md`](file:///d:/rail/server/dataset/README.md), and [`server/services/datasetService.js`](file:///d:/rail/server/services/datasetService.js).

### Impact
Allows synthetic data integration later without altering application models or API architecture.
