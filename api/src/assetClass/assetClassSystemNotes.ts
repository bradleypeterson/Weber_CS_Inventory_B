const ENTITY = "AssetClass";

export { ENTITY as ASSET_CLASS_ENTITY_TYPE };

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

export type AssetClassLikeForNote = {
  AssetClassID: number;
  Name: string;
  Abbreviation: string;
};

function computeAssetClassFieldChanges(
  existing: AssetClassLikeForNote,
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

export function hasAssetClassFieldChanges(
  existing: AssetClassLikeForNote,
  updates: { Name: string; Abbreviation: string }
): boolean {
  return computeAssetClassFieldChanges(existing, updates).length > 0;
}

export function formatAssetClassCreatedNote(assetClassID: number, name: string, abbreviation: string): string {
  return `Asset class ID ${assetClassID} was created; Name ${formatScalar(name)}; Abbreviation ${formatScalar(abbreviation)}.`;
}

export function formatAssetClassUpdateNote(
  assetClassID: number,
  existing: AssetClassLikeForNote,
  updates: { Name: string; Abbreviation: string }
): string {
  const changes = computeAssetClassFieldChanges(existing, updates);
  const header = `Asset class ID ${assetClassID} was edited`;
  if (changes.length === 0) {
    return `${header} (no tracked field changes detected).`;
  }
  return `${header}: ${changes.join("; ")}.`;
}

export function formatAssetClassDeletedNote(assetClassID: number, name: string, abbreviation: string): string {
  return `Asset class ID ${assetClassID} was deleted; Name ${formatScalar(name)}; Abbreviation ${formatScalar(abbreviation)}.`;
}
