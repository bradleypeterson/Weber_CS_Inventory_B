# Issues observed during Sprint 4

These existing findings are outside Danny's asset search state assignment.

| Area | Observation | Suggested follow-up |
| --- | --- | --- |
| Frontend lint | `src/api/fiscalYears.ts` has one explicit `any`; `ImportDataDashboard.tsx` has two; `AssetsDetailsDashboard.tsx` declares an unchanged variable with `let`. | Resolve these four existing lint errors separately. |
| Frontend lint warnings | Existing Fast Refresh warnings and an audit callback dependency warning remain. | Review separately without expanding the search-state change. |
| Asset details navigation | The back button is limited to users who can edit assets; its no-history fallback points to Asset Details. | Consider a visible return-to-search action for all viewers. Browser Back and the sidebar remain available. |
| Authentication cache | The shared React Query client is not cleared by the existing logout function. | Review cached API data isolation between authenticated users as a separate task. |
| Local build speed | The existing dependency installation took several minutes before completing the baseline build. A fresh installation built substantially faster. | Use `npm ci` to reproduce the locked dependencies when troubleshooting. |
