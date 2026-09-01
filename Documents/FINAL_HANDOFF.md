# Final Handoff: Weber CS Tech Inventory Tracker

Last updated: April 23, 2026

Application URL on Weber network:
`http://timetracker.users.weber.edu/inventory-group2`

## 1) Polishing the Application

### What was stabilized before handoff

- Filter behavior is now route-scoped and session-safe:
  - Filters persist per page instead of leaking across pages.
  - Applying with no selections clears that page's filters and returns all records.
  - Filters are cleared on logout and on successful login.
- Asset add vs import validation was separated:
  - `api/src/assets/schemas.ts` is strict for normal add/edit workflows.
  - `api/src/imports/schemas.ts` is permissive for bulk CSV ingestion.
- Audit history details are resilient to sparse import rows:
  - UI validation for audit details now accepts nullable/missing fields and normalizes values.
  - Imported assets that were later audited no longer fail details rendering when optional fields are absent.
- Seed data was expanded for Davis-campus usage:
  - Additional Weber Davis rooms/buildings were added in `api/src/db/seed_data.ts`.
  - Patrick user/person seed row was included (`W01111115`).

### Current known issues / sticky bugs

- `api` automated test chain is partially blocked on Node runtime compatibility:
  - `npm test` passes import/helper and asset-schema tests, then fails in auth tests with `buffer-equal-constant-time` (`SlowBuffer.prototype` error on Node `v20.20.0`).
  - Workaround: use build verification (`npm run build`) and targeted endpoint checks until jwt dependency path is modernized.
- Frontend production build warns about large chunks (Vite warning >500kB), but build succeeds.

### Verified at handoff

- `api`: `npm run build` passes.
- `web`: `npm run build` passes.
- Database init/seed flow works with the current scripts (`dbinit`, `dbseed`) and required `.env` values.

## 2) Clean Handoff Documentation

### Project topology

- `web/`: React + TypeScript + Vite frontend
- `api/`: Express + TypeScript backend
- `@types/`: shared permission/types contracts
- `Documents/`: project artifacts, references, and this handoff

### Startup checklist

1. Install dependencies in all packages.
2. Create `web/.env` and `api/.env`.
3. Confirm MySQL is running and credentials are valid.
4. Initialize and seed DB from `api`:
   - `npm run dbinit`
   - `npm run dbseed`
5. Run both apps:
   - `web`: `npm run dev`
   - `api`: `npm run dev`

### Required environment variables

`web/.env`

- `VITE_API_URL=http://localhost:8080`

`api/.env`

- `PORT=8080`
- `DB_HOST=...`
- `DB_USER=...`
- `DB_PASSWORD=...`
- `DB_PORT=...`
- `DB_NAME=...`
- `JWT_SECRET=...`

### Seeded baseline users (dev seed)

- W-numbers seeded in `api/src/db/seed_data.ts`: `W01111111` through `W01111115`.
- Default seeded password hash corresponds to the plaintext used by the team seed setup (`a combination`).
- `W01111115` (Patrick Beck) is seeded as both `Person` and `User` with department linkage.

### Architecture overview

#### Frontend

- Route/permission model:
  - `web/src/navigation/Configuration.tsx`
  - Page availability uses shared permission IDs from `@types/permissions`.
- Auth/session model:
  - `web/src/context/AuthProvider.tsx` handles token/permissions lifecycle.
  - Logout clears auth state and persisted filters.
- Filter model:
  - `web/src/filters/FilterProvider.tsx` stores filters by route key.
  - `web/src/filters/storage.ts` centralizes persistence keys/clear behavior.
- API client wrappers:
  - `web/src/api/*` modules validate response shapes with AJV.

#### Backend

- API composition:
  - `api/src/index.ts` mounts auth first, then token-protected routers.
- Database lifecycle:
  - `api/src/db/init.ts` recreates schema (drop/recreate behavior).
  - `api/src/db/seed_data.ts` inserts baseline lookup rows, users, and sample equipment.
- Procedure layer:
  - `api/src/db/procedures/*` holds SQL data access used by route handlers.
- Validation:
  - AJV-based request guards are colocated with feature modules.

### Core workflows

- Asset Search/Add/Edit/Archive: `web/src/dashboards/Assets*` + `api/src/assets/*`
- CSV Preview/Import: `web/src/dashboards/ImportDataDashboard/*` + `api/src/imports/*`
- Audit Initiation/History/Details/Notes: `web/src/dashboards/Audit*` + `api/src/audit/*`
- System Notes UI/API: `web/src/dashboards/SystemNotesDashboard/*` + `api/src/systemNotes/*`

### Notification status (important)

- SMTP/email notification pipeline is **not implemented in final handoff scope**.
- Notification UX controls are intentionally excluded in this final state.
- There are no production-ready `/notifications` endpoints or admin resend/history tools in this branch.

### Operational cautions for future teams

- `npm run dbinit` is destructive: it drops and recreates core tables.
- Keep dependency versions pinned to lockfiles; avoid broad upgrade commands without test verification.
- If login fails after environment reset, check:
  - `DB_NAME` and DB connection values,
  - seeded rows existence,
  - API started from the `api/` directory with local `node_modules` installed.

## 3) Unfinished Project Items

### High-priority unfinished items

1. Resolve Node/JWT test runtime incompatibility in auth test path (`buffer-equal-constant-time`) so `api` test suite is fully green.
2. Complete a production-grade notification subsystem only if SMTP access is approved (queueing, retries, templates, audit logs, and user preferences).
3. Finish permission-policy centralization to remove remaining duplicated checks across some route handlers and UI guards.
4. Improve List Options UX (bulk edits, discoverability, clearer add/archive flows).
5. Add integration tests for end-to-end flows (auth -> assets -> audit -> system notes) against a disposable DB.

### Medium-priority cleanup

1. Reduce frontend bundle size via route/component splitting.
2. Replace direct `fetch` usage in isolated spots with shared API helper conventions for consistent error handling.
3. Expand seed strategy for semester turnover (role-specific starter accounts, controlled fake data volume).

## 4) Final Semester Goals: Met vs Unmet

### System Enhancements

- Decouple add asset schema from import schema: **Met**
  - Separate schema files now enforce strict add rules and permissive import rules.
- Centralize permissions across codebase: **Partially met**
  - Shared permission IDs are in place and widely used; some enforcement logic remains distributed.
- Implement audit history (SystemNote) in UI: **Met**
  - System Notes dashboard and supporting API routes are available.
- SMTP server access and automated emails: **Unmet**
  - No institutional SMTP access was available during the project window.
- Seed database with initial data (rooms/users): **Partially met**
  - Core lookup tables, Davis-focused room data, and Patrick seed records were added; full client-validated canonical dataset is still pending.

### Bug Fixes

- Fix asset search validation/schema issue: **Mostly met**
  - Validation/schema split and audit-details normalization removed key blocking cases tied to imported sparse records.

### Backlog / Stretch goals

- Check in/ checkout ..
  - TODO

### Why some goals were unmet

- External dependency risk: SMTP ownership/access required institutional support outside team control.
- Time allocation shifted to stabilization and bug remediation needed for handoff-readiness.
- Data completeness depended on external canonical lists that were not fully available within the sprint window.

