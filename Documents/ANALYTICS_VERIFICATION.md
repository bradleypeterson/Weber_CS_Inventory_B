
## Original verification snapshot

Verified on 2026-10-23 against the current local database, including seeded data.
No equipment records were created, updated, archived, or deleted during verification.
Browser tests used normal login sessions and logged out after each account.

The database contained 277 equipment records, including 251 generated `TEST-LOC-*`
seed assets. Of these, 276 met the active, non-deleted condition. This is a snapshot
of the current database, not a claim that it contains only untouched seed data.

| Account | Scope | Active assets | Result |
| --- | --- | ---: | --- |
| W01111111 | All departments | 276 | Passed |
| W01111115 | Assigned department (School of Computing) | 275 | Passed |
| W01111116 | All departments | 276 | Passed |
| W01111117 | All departments | 276 | Passed |
| W01111118 | All departments | 276 | Passed |
| W01111119 | Access denied | N/A | API 403; browser direct URL denied |

All-department totals:

- Departments: School of Computing 275; Computer Science 1.
- Device types: Personal Computer 74; Laptop/Notebook 64; Printer 64;
  Projector 64; Unassigned 9; TV(any type) 1.
- Department and device-type breakdowns each sum to 276.
- The assigned-department account excludes the Computer Science TV, totaling 275.

## Checks performed

1. Read individual database equipment records and independently counted eligible
   records in JavaScript. Compared totals, IDs, names, and every breakdown count
   against the actual Analytics API handler using database-backed account permissions.
2. Used isolated headless Chrome with the real frontend login flow and local API.
   Compared the rendered total card and every row of both rendered data tables
   against separate SQL reads. Verified all six accounts listed above.
3. Confirmed the no-permission account receives API 403 and cannot open Analytics
   through its direct browser URL.

The one-time database and browser verification scripts were removed after these
checks passed. Automated aggregation and authorization coverage remains in
`api/tests/run-analytics-tests.ts`.
