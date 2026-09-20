# Technical Decisions

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
