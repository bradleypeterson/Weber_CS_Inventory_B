# Seeding Scope Notes (Davis and Ogden Campuses)

## Implemented in `api/src/db/seed_data.ts`

- Added Davis-campus building seeds:
  - `DSC` (Davis Stewart Center)
  - `CCE` (Center for Continuing Education)
  - `D13` (Building D13)
- Added additional Davis room seeds for:
  - `D2` (115, 116, 205, 206, 207, 208, 214, 220, 231, 241, 256, 262, 307)
  - Added D2 rooms 103, 104, 105, 106, 112, 113, 114, 117, 223, 225, 226, 232, 312, 314, 318, 320, 321, 322, 324 and 325 from the user-provided official classroom listing (2026-09-28). Its D02 label maps to existing D2; room 101 was already seeded. All 21 listed rooms are covered, with 34 D2 rooms total including retained existing rooms.
  - `D3` (201)
  - `DSC` (104, 105, 106, 107, 108, 109, 122, 124, 130, 221, 231)
  - Added DSC rooms 202, 203, 204, 205, 206, 233, 235, 236, 302, 304, 306, 307, 336, 337, 339, 340, 341 and 342 from the user-provided official classroom listing (2026-09-28). All 18 listed rooms are covered, with 29 DSC rooms total including retained existing rooms. Its baseline test contact remains linked to DSC104.
  - `CAE` (106, 141, 142, 143, 145). Rooms 141, 142, 143 and 145 were confirmed in the user-provided official classroom listing on 2026-09-28.
  - `CCE` (127, 206, 207, 209), confirmed in the user-provided official classroom listing on 2026-09-28. Room 127 is assigned to its baseline test contact.
  - `D13` (105, 123, 124, 207, 208, 217, 218), confirmed in the user-provided official classroom listing on 2026-09-28. Room 105 remains assigned to its baseline test contact.
- Added `Patrick Beck` as seeded `Person` + `User` (`W01111115`) and mapped to `SOC`.
- Added five fictional contact-only `Person` records, all mapped to `SOC` (no login accounts):
  - `W01111120`: D3 Test Contact, linked to `D3201`.
  - `W01111121`: DA Test Contact, location pending room confirmation.
  - `W01111122`: DSC Test Contact, linked to `DSC104`.
  - `W01111123`: CCE Test Contact, linked to `CCE127`.
  - `W01111124`: D13 Test Contact, linked to `D13105`.
  - CCE and D13 are fictional test assignments to verified rooms, not real staff office assignments.
  - Only DA remains pending with `LocationID = NULL`; its name indicates the intended building only.

## Public sources used for room/building validation

### Ogden additions (2026-09-28)

- User-provided official classroom listing: added McKay Education Building (ED); reused existing Elizabeth Hall (EH) and Engineering Technology (ET).
- ED: 301, 304, 321, 322, 326, 327, 328, 330, 331, 010A, 010B (11 rooms). Leading zeros are preserved.
- EH: 104, 105, 106, 115, 116, 117, 118, 203, 204, 205, 206, 215, 216, 217, 218, 219, 220, 304, 305, 306, 315, 316, 317, 323, 403, 406, 407, 408 (28 added rooms).
- ET: 102, 104, 204, 216, 224, 228, 238, 240 (8 added rooms).
- Existing EH room 102 (legacy barcode EH101) and ET room 101 remain unchanged. Total rooms: ED 11, EH 29, ET 9.
- Append new buildings and locations to preserve existing numeric seed references. No assets or contacts added in this expansion.

- Additional user-provided official classroom listing (2026-09-28): added IE (Interprofessional Education Building), KA (Kimball Visual Arts Center), and LH (Lindquist Hall).
- IE rooms: 107A, 107B (2 rooms).
- KA room: 143 (1 room).
- LH rooms: 102, 104, 106, 112, 114, 116, 124, 174, 201, 202, 204, 205, 206, 207, 211, 212, 214, 216, 222, 280, 301, 302, 304, 305, 342, 395, 022, 050, 054 (29 rooms). Leading zeros are preserved.

- Added from the user-provided official listing (2026-09-28): Stewart Library (LI), room 325; Lind Lecture (LL), rooms 101, 102, 121, 122, 123, 124, 125, 130, 221, 222, 223, 224, 228, 229, 231.
- Added individual portable buildings M5, M6, M7, M13, M14, M16, M17. Each has rooms 100 and 101 except M14, which has only room 101 in the listing. M15 is not added because no room is listed.
- This batch adds 9 buildings and 29 rooms, without changing existing seed IDs or adding assets.

- Added from the user-provided official listing (2026-09-28): Marriott Allied Health (MH), rooms 117, 222, 304, 327, 341, 351, 355, 417, 480; Outdoor Adventure & Welcome Center (OA), room 203.
- Reused existing NB for Noorda Technology Building, preserving its legacy name and existing room 101. Added rooms 122, 127, 204, 211, 232, 236, 304, 305, 311, 312, 316, 318, 322, 324, 325, 326, 328, 001, 004 (19 additions; 20 total). Leading zeros are preserved.
- This batch adds 2 buildings and 29 rooms. Legacy MB is retained without merging it into MH because their equivalence is unconfirmed.


- Added from the user-provided official classroom listing (2026-09-28): Swenson Building (SW), Tracy Hall Science Center (TY), and Wattis Business (WB).
- SW rooms: 134, 225, 232, 238, 314, 410 (6 rooms).
- TY rooms: 102, 209, 229, 234, 240, 340, 342, 363, 364, 365, 426, 448, 449, 466, 101P, 101R (16 rooms). Letter suffixes are preserved.
- WB rooms: 103, 104, 105, 106, 110, 112, 113, 116, 117, 119, 120, 121, 122, 203 (14 rooms).
- This batch adds 3 buildings and 36 rooms, without adding assets.

### Source links

- https://www.weber.edu/facilities/General-Lecture-Classrooms.html (CCE 127 and D13 105 verified for test-contact assignments, 2026-09-28)
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

## Fictional assets for room testing

- Removed the individual inserts for TEST-CAE141, TEST-CAE142 and TEST-CCE127 from the seed. Fresh databases now receive generated assets for those rooms through the shared insertion below. The three previously inserted local DB records remain unchanged.
- Added one fictional asset per active room with no non-deleted equipment, cycling PC/LT/PJ/PR by LocationID. Existing equipment is preserved. Deleted rooms/buildings are excluded; an archived but non-deleted asset also counts as existing equipment.
- Generated tags are TEST-LOC-<LocationID> and serials SN-TEST-LOC-<LocationID>. Defaults: SOC, Good, no contact, not archived, Rapid7/CrowdStrike false. Projectors use asset class CE; the other three types use CP. These are test assignments, not real inventory.
- Local DB validation before removing the individual seed inserts: inserted 251 assets (PC 62, LT 62, PJ 63, PR 64), zero uncovered active rooms. Repeating this asset-only insertion added zero rows. Reference lookups and identifier collisions were checked before committing the transaction. Fresh seed counts/types differ because the three rooms now use the shared allocation.
- This does not make the entire seed script safe to rerun on populated databases; its earlier inserts are still initial-load operations. DA still has no room and receives no generated asset.

- Complete baseline contact coverage by confirming DA's building identity and room, then assigning its test contact. All other target Davis buildings have linked contacts in the seed.
- Keep one non-admin seeded user per major operational role (asset editor, auditor, read-only) for QA coverage.

## Rows that can be excluded for Davis-room seeding

- Any non-Davis campus building rows.
- Any row without a valid physical room identifier (for example `Virtual`, `Atrium`, or blank room values).
- Duplicate room rows for the same `(BuildingAbbreviation, RoomNumber)` pair.
- Any row with a building abbreviation not in the active Davis set (`D2`, `D3`, `DA`, `CAE`, `DSC`, `CCE`, `D13`).
