# Changelog

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
