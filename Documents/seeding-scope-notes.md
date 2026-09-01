# Seeding Scope Notes (Davis Campus)

## Implemented in `api/src/db/seed_data.ts`

- Added Davis-campus building seeds:
  - `DSC` (Davis Stewart Center)
  - `CCE` (Center for Continuing Education)
  - `D13` (Building D13)
- Added additional Davis room seeds for:
  - `D2` (115, 116, 205, 206, 207, 208, 214, 220, 231, 241, 256, 262, 307)
  - `D3` (201)
  - `DSC` (104, 105, 106, 107, 108, 109, 122, 124, 130, 221, 231)
  - `CAE` (106)
- Added `Patrick Beck` as seeded `Person` + `User` (`W01111115`) and mapped to `SOC`.

## Public sources used for room/building validation

- https://www.weber.edu/maps/davis-campus.html
- https://www.weber.edu/WSUDavis/study-rooms.html
- https://www.weber.edu/wsudavis/student-centers-services.html
- https://www.weber.edu/wsudavis/campus-life.html
- https://www.weber.edu/wsudavis/stores.html
- https://www.weber.edu/registration/contact.html
- https://www.weber.edu/web-accessibility/contact.html
- https://www.weber.edu/automotive/General_Motors_Training_Center.html
- https://www.weber.edu/PresidentsOffice/board-of-trustees-meeting-schedule.html

## Additional seed data still recommended

- Seed at least one baseline contact person per active Davis building (`D2`, `D3`, `DA`, `CAE`, `DSC`, `CCE`, `D13`) to simplify initial assignment workflows.
- Add a small seed set of representative locations for `DA`, `CCE`, and `D13` once room numbers are confirmed.
- Keep one non-admin seeded user per major operational role (asset editor, auditor, read-only) for QA coverage.

## Rows that can be excluded for Davis-room seeding

- Any non-Davis campus building rows.
- Any row without a valid physical room identifier (for example `Virtual`, `Atrium`, or blank room values).
- Duplicate room rows for the same `(BuildingAbbreviation, RoomNumber)` pair.
- Any row with a building abbreviation not in the active Davis set (`D2`, `D3`, `DA`, `CAE`, `DSC`, `CCE`, `D13`).
