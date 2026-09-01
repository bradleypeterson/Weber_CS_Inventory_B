const ENTITY = "User";

export { ENTITY as USER_ENTITY_TYPE };

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

/** Never include password-related fields in audit payloads or note text */
const SENSITIVE_KEYS = new Set([
  "hashedNewPassword",
  "hashedOldPassword",
  "Salt",
  "password",
  "newPassword",
  "oldPassword"
]);

const TRACKED_UPDATE_KEYS = new Set([
  "FirstName",
  "LastName",
  "WNumber",
  "LocationID",
  "BuildingID",
  "DepartmentID",
  "Permissions"
]);

export type UserLikeForNote = {
  FirstName: string;
  LastName: string;
  WNumber: string;
  BuildingID?: number | null;
  LocationID: number;
  DepartmentID: number[];
  Permissions: number[];
};

export function pickUserUpdatesForSystemNote(
  updates: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
): Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null> {
  const out: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    if (!TRACKED_UPDATE_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export function formatUserCreatedNote(personID: number, wNumber: string, firstName: string, lastName: string): string {
  const name = `${firstName} ${lastName}`.trim() || "(no name)";
  return `User Person ID ${personID} was created; WNumber ${formatScalar(wNumber)}; Name ${formatScalar(name)}.`;
}

export function formatUserUpdateNote(
  personID: number,
  existing: UserLikeForNote,
  updates: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
): string {
  const existingRecord: Record<string, unknown> = {
    FirstName: existing.FirstName,
    LastName: existing.LastName,
    WNumber: existing.WNumber,
    LocationID: existing.LocationID,
    BuildingID: existing.BuildingID ?? null,
    DepartmentID: existing.DepartmentID,
    Permissions: existing.Permissions
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

  const header = `User Person ID ${personID} was edited`;
  if (changes.length === 0) {
    return `${header} (no tracked field changes detected).`;
  }
  return `${header}: ${changes.join("; ")}.`;
}

export function formatUserArchivedNote(personID: number, wNumber: string | null | undefined): string {
  const w =
    wNumber !== undefined && wNumber !== null && String(wNumber).trim() !== ""
      ? formatScalar(wNumber)
      : "(unknown WNumber)";
  return `User Person ID ${personID} was archived (deleted); WNumber ${w}.`;
}
