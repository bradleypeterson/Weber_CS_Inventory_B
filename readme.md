# Inventory Tracker

An asset tracker for Weber State University.

## Repository at a Glance

- `web/`: Frontend (React + TypeScript + Vite)
- `api/`: Backend (Express + TypeScript)
- `@types/`: Shared schemas/types used by frontend and backend
- `Documents/` and `videos/`: Project requirements, references, and walkthroughs

## Final Handoff

- Full handoff documentation: `Documents/FINAL_HANDOFF.md`
- Includes architecture, setup/runbook, known issues, unfinished items, and final goals status.

## Setup [video](https://github.com/chase-stodd/Weber_CS_tech_inventory_Group_2/blob/main/Documents/Inventory_Tracker_Demo.mp4)

Create a local MySQL server instance then clone the repository and install node modules. 

    git clone https://github.com/chase-stodd/Weber_CS_tech_inventory_Group_2
    cd web && npm install
    cd api && npm install
    cd @types && npm install

> Dependency note: do **not** run `npm audit fix` in this repository. It can upgrade packages to incompatible versions and break the app.  
> Keep dependency versions aligned with the committed lock files. If dependencies drift, reinstall with:
>
>     cd web && npm ci
>     cd api && npm ci
>     cd @types && npm ci

Next, add a `.env` file to both the `web` and `api` project directories.

#### Web .env

    VITE_API_URL=http://localhost:8080

#### Api .env

    PORT=8080
    DB_HOST=[IP OR URL TO MYSQL SERVER]
    DB_USER=[MYSQL USER]
    DB_PASSWORD=[MYSQL PASSWORD]
    DB_PORT=[MYSQL PORT]
    JWT_SECRET=[SECRET]
    DB_NAME=[DATABASE NAME]

Finally, initialize the database:

    cd api && npm run dbinit && npm run dbseed

> `npm run dbinit` drops/recreates tables. Use only for local reset/seed workflows.

## Running the Project

In two separate terminals, run the following commands:

    cd web && npm run dev
    cd api && npm run dev

The frontend will be available on http://localhost:5173  
The API will run on http://localhost:8080

## Running API Tests

From the `api/` directory:

    npm test

API tests are discovered automatically from `api/tests/run-*-tests.ts`, and each test file runs in its own process.


## Frontend Onboarding Guide

This section is for new frontend contributors.

### Design references

- `Documents/Wireframes.zip`
- `Documents/UI Feedback.docx`
- `web/public/screenshots/`

### Main frontend folders

- `web/src/dashboards`: App pages (most feature screens live here)
- `web/src/navigation/Configuration.tsx`: Source of truth for menus, dashboards, tabs, and pages
- `web/src/elements`: Reusable UI controls (buttons, inputs, table, modal, etc.)
- `web/src/components`: Larger shared UI blocks (sidebar, filter panel, notes)
- `web/src/index.css`: Global colors/theme variables
- `web/src/fonts.css`: Custom font definitions

### Navigation model

- `menu` entries appear in the left sidebar.
- `dashboard` entries are pages under a sidebar menu.
- `tab` entries are nested routes under a dashboard.
- `page` entries are standalone routes (outside sidebar flow, such as Login).

### Navigation gotchas

- The route config file is `web/src/navigation/Configuration.tsx` (capital `C`).
- Route paths are generated from labels, so label changes also change URLs.
- Internal navigation often uses labels, not hardcoded URLs. Renaming labels can break navigation calls.
- Logged-out users only get the Login route until auth is present.
- `page` routes do not follow the normal sidebar flow; use them intentionally for standalone screens.

### How new pages are added

#### 1. Create the dashboard component

Create a new folder in `web/src/dashboards`, usually with:

- `YourDashboard.tsx`
- `YourDashboard.module.css`

#### 2. Register it in navigation

In `web/src/navigation/Configuration.tsx`:

1. Import your new dashboard component.
2. Add it to an existing `menu` as a `type: "dashboard"` entry.
3. Set `availability` permissions.
4. Optionally add `filters` and/or `tabs`.

Example (add a dashboard under Assets):

```tsx
{
  type: "dashboard",
  availability: () => true,
  label: "Inventory Report",
  element: <InventoryReportDashboard />,
  filters: ["Department"]
}
```

#### 3. Understand generated URL paths

Paths are generated from labels in navigation:

- Menu label `"Assets"` + dashboard label `"Inventory Report"` becomes:
- `/assets/inventory-report`

So if you rename labels in `Configuration.tsx`, you also change route URLs.

#### 4. Add a standalone page (no sidebar)

If you need a page outside the sidebar flow, add:

```tsx
{
  type: "page",
  label: "YourPage",
  element: <YourPageComponent />,
  availability: () => true
}
```

### Optional: connect filters to a page

1. Add filter names in the dashboard entry (in `Configuration.tsx`).
2. Ensure those filter keys exist in `web/src/filters/FilterConfiguration.tsx`.
3. The filter panel will render automatically for routes that define filters.

Current filter keys include:

- `Department`
- `Asset Class`
- `Permission`
- `Building`
- `Room`
- `Status`
- `Date`
- `Auditor`

### Practical UI notes

- Most pages use CSS Modules (`*.module.css`) for local styling.
- Shared look and spacing should be pushed into reusable elements/components where possible.
- Sidebar and filter panel visibility are route-driven; they appear automatically based on route type.

### Where styling changes should go

- Global color tokens and app-wide defaults: `web/src/index.css`
- Font registration: `web/src/fonts.css`
- App layout grid (sidebar/filter/content columns): `web/src/App.css`
- Shared component styling: local `*.module.css` files under `web/src/elements` or `web/src/components`
- Page-specific styling: each dashboard folder under `web/src/dashboards`

### New page definition of done

1. Route is registered in `web/src/navigation/Configuration.tsx` and opens correctly.
2. Page appears in sidebar if it is a `dashboard` route.
3. Permission behavior is correct (`availability` tested with expected role access).
4. Filter panel behavior is correct (if filters were added).
5. Layout works at common desktop and mobile widths without overflow or clipped controls.

## Extensions

    ESLint - Provides warnings and errors for common JavaScript issues.
    Install from the VS Code extension marketplace.
