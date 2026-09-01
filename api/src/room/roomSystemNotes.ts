const ENTITY = "Room";

export { ENTITY as ROOM_ENTITY_TYPE };

const MAX_VALUE_LEN = 200;

function truncateValue(s: string): string {
  if (s.length <= MAX_VALUE_LEN) return s;
  return `${s.slice(0, MAX_VALUE_LEN)}…`;
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "string") return `"${truncateValue(value.replace(/"/g, '\\"'))}"`;
  return truncateValue(String(value));
}

function normalizeForCompare(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function valuesDiffer(before: unknown, after: unknown): boolean {
  return normalizeForCompare(before) !== normalizeForCompare(after);
}

export type RoomLikeForNote = {
  LocationID: number;
  RoomNumber: string;
  BuildingID: number;
  Barcode: string;
};

function computeRoomFieldChanges(
  existing: RoomLikeForNote,
  updates: { RoomNumber: string; BuildingID: number; Barcode: string }
): string[] {
  const changes: string[] = [];
  if (valuesDiffer(existing.RoomNumber, updates.RoomNumber)) {
    changes.push(`field RoomNumber was updated from ${formatScalar(existing.RoomNumber)} to ${formatScalar(updates.RoomNumber)}`);
  }
  if (valuesDiffer(existing.BuildingID, updates.BuildingID)) {
    changes.push(`field BuildingID was updated from ${formatScalar(existing.BuildingID)} to ${formatScalar(updates.BuildingID)}`);
  }
  if (valuesDiffer(existing.Barcode, updates.Barcode)) {
    changes.push(`field Barcode was updated from ${formatScalar(existing.Barcode)} to ${formatScalar(updates.Barcode)}`);
  }
  return changes;
}

export function hasRoomFieldChanges(
  existing: RoomLikeForNote,
  updates: { RoomNumber: string; BuildingID: number; Barcode: string }
): boolean {
  return computeRoomFieldChanges(existing, updates).length > 0;
}

export function formatRoomCreatedNote(locationID: number, roomNumber: string, buildingID: number, barcode: string): string {
  return `Room Location ID ${locationID} was created; RoomNumber ${formatScalar(roomNumber)}; BuildingID ${formatScalar(buildingID)}; Barcode ${formatScalar(barcode)}.`;
}

export function formatRoomUpdateNote(
  locationID: number,
  existing: RoomLikeForNote,
  updates: { RoomNumber: string; BuildingID: number; Barcode: string }
): string {
  const changes = computeRoomFieldChanges(existing, updates);
  const header = `Room Location ID ${locationID} was edited`;
  if (changes.length === 0) {
    return `${header} (no tracked field changes detected).`;
  }
  return `${header}: ${changes.join("; ")}.`;
}

export function formatRoomDeletedNote(locationID: number, roomNumber: string, buildingID: number, barcode: string): string {
  return `Room Location ID ${locationID} was deleted; RoomNumber ${formatScalar(roomNumber)}; BuildingID ${formatScalar(buildingID)}; Barcode ${formatScalar(barcode)}.`;
}
