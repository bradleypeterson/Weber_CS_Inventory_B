const ENTITY = "DeviceType";

export { ENTITY as DEVICE_TYPE_ENTITY_TYPE };

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

export type DeviceTypeLikeForNote = {
  DeviceTypeID: number;
  Name: string;
  Abbreviation: string;
};

function computeDeviceTypeFieldChanges(
  existing: DeviceTypeLikeForNote,
  updates: { Name: string; Abbreviation: string }
): string[] {
  const changes: string[] = [];
  if (valuesDiffer(existing.Name, updates.Name)) {
    changes.push(`field Name was updated from ${formatScalar(existing.Name)} to ${formatScalar(updates.Name)}`);
  }
  if (valuesDiffer(existing.Abbreviation, updates.Abbreviation)) {
    changes.push(
      `field Abbreviation was updated from ${formatScalar(existing.Abbreviation)} to ${formatScalar(updates.Abbreviation)}`
    );
  }
  return changes;
}

export function hasDeviceTypeFieldChanges(
  existing: DeviceTypeLikeForNote,
  updates: { Name: string; Abbreviation: string }
): boolean {
  return computeDeviceTypeFieldChanges(existing, updates).length > 0;
}

export function formatDeviceTypeCreatedNote(deviceTypeID: number, name: string, abbreviation: string): string {
  return `Device type ID ${deviceTypeID} was created; Name ${formatScalar(name)}; Abbreviation ${formatScalar(abbreviation)}.`;
}

export function formatDeviceTypeUpdateNote(
  deviceTypeID: number,
  existing: DeviceTypeLikeForNote,
  updates: { Name: string; Abbreviation: string }
): string {
  const changes = computeDeviceTypeFieldChanges(existing, updates);
  const header = `Device type ID ${deviceTypeID} was edited`;
  if (changes.length === 0) {
    return `${header} (no tracked field changes detected).`;
  }
  return `${header}: ${changes.join("; ")}.`;
}

export function formatDeviceTypeDeletedNote(deviceTypeID: number, name: string, abbreviation: string): string {
  return `Device type ID ${deviceTypeID} was deleted; Name ${formatScalar(name)}; Abbreviation ${formatScalar(abbreviation)}.`;
}
