# Changelog

## Initial Existing-Codebase Snapshot

### Current Implementation
- Full-stack voluntary seat exchange platform (`RailTogether`) implemented.
- Group split detection and deterministic compatibility ranking (+30 Coach, +20 Berth, +30 Proximity, +10 Solo, +10 Compatibility).
- Interactive 72-berth coach seat map with bay compartments, color-coded status badges, and selection inspector.
- End-to-end voluntary swap request lifecycle (creation, pending status, accept with atomic seat exchange, reject, cancel).
- 1-Click Demo Journey seeding (`12011 Shatabdi Express` with 4 split family members and 3 candidate passengers).
- Plug-and-play dataset service with graceful fallback when `server/dataset/uploads/` is empty.
- JWT authentication with instant demo access.

### Existing Structure
- Root package orchestrating `client/` (Vite, React, Tailwind CSS) and `server/` (Express, Mongoose, MongoDB).
- Decoupled REST API routing with error handling and request authentication.

### Memory System Created
- Persistent AI documentation system established in `.ai/` and root `AGENTS.md` based directly on the existing codebase state.
