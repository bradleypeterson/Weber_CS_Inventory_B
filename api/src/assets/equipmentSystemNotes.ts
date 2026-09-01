import type { AssetDetails } from "../../../@types/data";

const ENTITY = "Equipment";

export { ENTITY as EQUIPMENT_ENTITY_TYPE };

type EquipmentCreateFields = {
  TagNumber: string;
  SerialNumber?: string | null;
};

const MAX_VALUE_LEN = 200;

function truncateValue(s: string): string {
  if (s.length <= MAX_VALUE_LEN) return s;
  return `${s.slice(0, MAX_VALUE_LEN)}…`;
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "string") return `"${truncateValue(value.replace(/"/g, '\\"'))}"`;
  if (typeof value === "boolean") return value ? "true" : "false";
  return truncateValue(String(value));
}

function normalizeForCompare(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

function valuesDiffer(before: unknown, after: unknown): boolean {
  return normalizeForCompare(before) !== normalizeForCompare(after);
}

export function formatEquipmentCreatedNote(equipmentId: number, params: EquipmentCreateFields): string {
  const parts = [`Equipment ID ${equipmentId} was created`, `TagNumber ${formatScalar(params.TagNumber)}`];
  if (params.SerialNumber !== undefined && params.SerialNumber !== null && String(params.SerialNumber).trim() !== "") {
    parts.push(`SerialNumber ${formatScalar(params.SerialNumber)}`);
  }
  return `${parts.join("; ")}.`;
}

const UPDATE_SKIP_KEYS = new Set(["EquipmentID"]);

export function formatEquipmentUpdateNote(
  existing: AssetDetails,
  updates: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
): string {
  const changes: string[] = [];
  const existingRecord = existing as Record<string, unknown>;

  for (const [key, value] of Object.entries(updates)) {
    if (UPDATE_SKIP_KEYS.has(key)) continue;
    if (key in existingRecord) {
      const before = existingRecord[key];
      if (!valuesDiffer(before, value)) continue;
      changes.push(`field ${key} was updated from ${formatScalar(before)} to ${formatScalar(value)}`);
    } else {
      changes.push(`field ${key} was set to ${formatScalar(value)}`);
    }
  }

  const tag =
    existing.TagNumber !== undefined && existing.TagNumber !== null && String(existing.TagNumber).trim() !== ""
      ? formatScalar(existing.TagNumber)
      : "(unknown tag)";
  const header = `Equipment ID ${existing.EquipmentID} with Tag Number ${tag} was edited`;
  if (changes.length === 0) {
    return `${header} (no tracked field changes detected).`;
  }
  return `${header}: ${changes.join("; ")}.`;
}

export function formatEquipmentArchivedNote(equipmentId: number, tagNumber: string | null | undefined): string {
  const tag = tagNumber !== undefined && tagNumber !== null && String(tagNumber).trim() !== ""
    ? formatScalar(tagNumber)
    : "(unknown tag)";
  return `Equipment ID ${equipmentId} with Tag Number ${tag} was archived (deleted).`;
}
