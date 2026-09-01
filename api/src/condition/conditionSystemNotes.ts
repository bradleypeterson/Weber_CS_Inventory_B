const ENTITY = "Condition";

export { ENTITY as CONDITION_ENTITY_TYPE };

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

export type ConditionLikeForNote = {
  ConditionID: number;
  ConditionName: string;
  ConditionAbbreviation: string;
};

function computeConditionFieldChanges(
  existing: ConditionLikeForNote,
  updates: { ConditionName: string; ConditionAbbreviation: string }
): string[] {
  const changes: string[] = [];
  if (valuesDiffer(existing.ConditionName, updates.ConditionName)) {
    changes.push(
      `field ConditionName was updated from ${formatScalar(existing.ConditionName)} to ${formatScalar(updates.ConditionName)}`
    );
  }
  if (valuesDiffer(existing.ConditionAbbreviation, updates.ConditionAbbreviation)) {
    changes.push(
      `field ConditionAbbreviation was updated from ${formatScalar(existing.ConditionAbbreviation)} to ${formatScalar(updates.ConditionAbbreviation)}`
    );
  }
  return changes;
}

export function hasConditionFieldChanges(
  existing: ConditionLikeForNote,
  updates: { ConditionName: string; ConditionAbbreviation: string }
): boolean {
  return computeConditionFieldChanges(existing, updates).length > 0;
}

export function formatConditionCreatedNote(
  conditionID: number,
  conditionName: string,
  conditionAbbreviation: string
): string {
  return `Condition ID ${conditionID} was created; ConditionName ${formatScalar(conditionName)}; ConditionAbbreviation ${formatScalar(conditionAbbreviation)}.`;
}

export function formatConditionUpdateNote(
  conditionID: number,
  existing: ConditionLikeForNote,
  updates: { ConditionName: string; ConditionAbbreviation: string }
): string {
  const changes = computeConditionFieldChanges(existing, updates);
  const header = `Condition ID ${conditionID} was edited`;
  if (changes.length === 0) {
    return `${header} (no tracked field changes detected).`;
  }
  return `${header}: ${changes.join("; ")}.`;
}

export function formatConditionDeletedNote(
  conditionID: number,
  conditionName: string,
  conditionAbbreviation: string
): string {
  return `Condition ID ${conditionID} was deleted; ConditionName ${formatScalar(conditionName)}; ConditionAbbreviation ${formatScalar(conditionAbbreviation)}.`;
}
