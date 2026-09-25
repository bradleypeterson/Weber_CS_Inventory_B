# Frontend Onboarding Guide
This section is for new frontend contributors working within the `web/` directory.

## Design references
- `Documents/Archive/First Group - Pre 2026/Wireframes.zip`
- `Documents/Archive/First Group - Pre 2026/UI Feedback.docx`
- `web/public/screenshots/`
## Main frontend folders
- `web/src/dashboards`: App pages (most feature screens live here)
- `web/src/navigation/Configuration.tsx`: Source of truth for menus, dashboards, tabs, and pages
- `web/src/elements`: Reusable UI controls (buttons, inputs, table, modal, etc.)
- `web/src/components`: Larger shared UI blocks (sidebar, filter panel, notes)
- `web/src/index.css`: Global colors/theme variables
- `web/src/fonts.css`: Custom font definitions
## Navigation model
- `menu` entries appear in the left sidebar.
- `dashboard` entries are pages under a sidebar menu.
- `tab` entries are nested routes under a dashboard.
- `page` entries are standalone routes (outside sidebar flow, such as Login).
## Navigation gotchas
- The route config file is `web/src/navigation/Configuration.tsx` (capital `C`).
- Route paths are generated from labels, so label changes also change URLs.
- Internal navigation often uses labels, not hardcoded URLs.
- Logged-out users only get the Login route until auth is present.
## How new pages are added
1. Create the dashboard component in `web/src/dashboards`.
2. Register it in `web/src/navigation/Configuration.tsx`.
3. Optionally add filters to the configuration.
## New page definition of done
1. Route is registered and opens correctly.
2. Page appears in sidebar if it is a `dashboard` route.
3. Permission behavior is correct (`availability` tested).
4. Filter panel behavior is correct.
5. Layout works at common desktop and mobile widths.
