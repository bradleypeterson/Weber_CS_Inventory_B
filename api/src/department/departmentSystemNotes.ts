const ENTITY = "Department";

export { ENTITY as DEPARTMENT_ENTITY_TYPE };

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

export type DepartmentLikeForNote = {
  DepartmentID: number;
  Name: string;
  Abbreviation: string;
};

function computeDepartmentFieldChanges(
  existing: DepartmentLikeForNote,
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

export function hasDepartmentFieldChanges(
  existing: DepartmentLikeForNote,
  updates: { Name: string; Abbreviation: string }
): boolean {
  return computeDepartmentFieldChanges(existing, updates).length > 0;
}

export function formatDepartmentCreatedNote(departmentID: number, name: string, abbreviation: string): string {
  return `Department ID ${departmentID} was created; Name ${formatScalar(name)}; Abbreviation ${formatScalar(abbreviation)}.`;
}

export function formatDepartmentUpdateNote(
  departmentID: number,
  existing: DepartmentLikeForNote,
  updates: { Name: string; Abbreviation: string }
): string {
  const changes = computeDepartmentFieldChanges(existing, updates);
  const header = `Department ID ${departmentID} was edited`;
  if (changes.length === 0) {
    return `${header} (no tracked field changes detected).`;
  }
  return `${header}: ${changes.join("; ")}.`;
}

export function formatDepartmentDeletedNote(departmentID: number, name: string, abbreviation: string): string {
  return `Department ID ${departmentID} was deleted; Name ${formatScalar(name)}; Abbreviation ${formatScalar(abbreviation)}.`;
}
