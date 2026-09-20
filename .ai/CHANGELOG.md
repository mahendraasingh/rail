# Changelog

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
