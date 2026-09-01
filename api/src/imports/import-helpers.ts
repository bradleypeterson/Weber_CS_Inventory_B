export const NOTE_HEADERS = ["NOTES 1", "NOTES 2", "NOTES 3"] as const;
export const RECOGNIZED_IGNORED_HEADERS = [
  "BLDG DESCRIPTION",
  "CONDITION DESCRIPTION",
  "DEVICE TYPE DESC"
] as const;

export type CsvRecord = Record<string, string>;

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getUnknownHeaders(headers: string[], supportedHeaders: string[]) {
  const knownHeaders = new Set(supportedHeaders.map((header) => normalizeKey(header)));
  return headers.filter((header) => !knownHeaders.has(normalizeKey(header)));
}

export function buildSupportedHeaders(fieldSpecHeaders: string[][]) {
  const supported = new Set<string>();
  fieldSpecHeaders.forEach((headers) => headers.forEach((header) => supported.add(header)));
  NOTE_HEADERS.forEach((header) => supported.add(header));
  RECOGNIZED_IGNORED_HEADERS.forEach((header) => supported.add(header));
  return [...supported];
}

export function buildUnknownHeaderWarnings(unknownHeaders: string[]) {
  if (unknownHeaders.length === 0) return [] as string[];
  return [`Unknown column(s) will be ignored: ${unknownHeaders.join(", ")}`];
}

export function extractRowNotes(values: CsvRecord, noteHeaders: readonly string[] = NOTE_HEADERS) {
  return noteHeaders.map((header) => (values[header] ?? "").trim()).filter((note) => note !== "");
}
