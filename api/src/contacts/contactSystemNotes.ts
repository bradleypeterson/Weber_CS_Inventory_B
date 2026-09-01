const ENTITY = "Contact";

export { ENTITY as CONTACT_ENTITY_TYPE };

const MAX_VALUE_LEN = 200;

function truncateValue(s: string): string {
  if (s.length <= MAX_VALUE_LEN) return s;
  return `${s.slice(0, MAX_VALUE_LEN)}…`;
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "string") return `"${truncateValue(value.replace(/"/g, '\\"'))}"`;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    const nums = value.map((v) => Number(v)).sort((a, b) => a - b);
    return `[${nums.join(", ")}]`;
  }
  return truncateValue(String(value));
}

function normalizeForCompare(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return [...value].map((v) => Number(v)).sort((a, b) => a - b).join(",");
  }
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

function valuesDiffer(before: unknown, after: unknown): boolean {
  return normalizeForCompare(before) !== normalizeForCompare(after);
}

const TRACKED_CONTACT_KEYS = new Set([
  "WNumber",
  "FirstName",
  "LastName",
  "LocationID",
  "BuildingID",
  "DepartmentID"
]);

export type ContactLikeForNote = {
  WNumber: string;
  FirstName: string;
  LastName: string;
  BuildingID?: number | null;
  LocationID?: number | null;
  DepartmentID: number[];
};

export function pickContactFieldsForSystemNote(
  raw: Record<string, string | number | number[] | undefined | null>
): Record<string, string | number | number[]> {
  const out: Record<string, string | number | number[]> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!TRACKED_CONTACT_KEYS.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value as string | number | number[];
  }
  return out;
}

export function formatContactCreatedNote(
  personID: number,
  wNumber: string,
  firstName: string,
  lastName: string
): string {
  const name = `${firstName} ${lastName}`.trim() || "(no name)";
  return `Contact Person ID ${personID} was created; WNumber ${formatScalar(wNumber)}; Name ${formatScalar(name)}.`;
}

function computeContactFieldChanges(
  existing: ContactLikeForNote,
  updates: Record<string, string | number | number[]>
): string[] {
  const existingRecord: Record<string, unknown> = {
    WNumber: existing.WNumber,
    FirstName: existing.FirstName,
    LastName: existing.LastName,
    LocationID: existing.LocationID ?? null,
    BuildingID: existing.BuildingID ?? null,
    DepartmentID: existing.DepartmentID
  };

  const changes: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (!(key in existingRecord)) {
      changes.push(`field ${key} was set to ${formatScalar(value)}`);
      continue;
    }
    const before = existingRecord[key];
    if (!valuesDiffer(before, value)) continue;
    changes.push(`field ${key} was updated from ${formatScalar(before)} to ${formatScalar(value)}`);
  }
  return changes;
}

export function hasContactFieldChanges(
  existing: ContactLikeForNote,
  updates: Record<string, string | number | number[]>
): boolean {
  return computeContactFieldChanges(existing, updates).length > 0;
}

export function formatContactUpdateNote(
  personID: number,
  existing: ContactLikeForNote,
  updates: Record<string, string | number | number[]>
): string {
  const changes = computeContactFieldChanges(existing, updates);
  const header = `Contact Person ID ${personID} was edited`;
  if (changes.length === 0) {
    return `${header} (no tracked field changes detected).`;
  }
  return `${header}: ${changes.join("; ")}.`;
}

export function formatContactArchivedNote(personID: number, wNumber: string | null | undefined): string {
  const w =
    wNumber !== undefined && wNumber !== null && String(wNumber).trim() !== ""
      ? formatScalar(wNumber)
      : "(unknown WNumber)";
  return `Contact Person ID ${personID} was archived (deleted); WNumber ${w}.`;
}
