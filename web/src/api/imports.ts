import type { JSONSchemaType } from "ajv";
import { ajv } from "../ajv";
import { post } from "./helpers";

export type ImportPreviewRequest = {
  fileName: string;
  fileContents: string;
};

export type ImportPreviewRow = {
  rowNumber: number;
  values: Record<string, string>;
  issues: string[];
  warnings: string[];
  valid: boolean;
};

export type ImportPreviewResponse = {
  headers: string[];
  rows: ImportPreviewRow[];
  validCount: number;
  invalidCount: number;
  headerValid: boolean;
  headerMessage: string;
  warnings: string[];
};

export type ImportAssetsRequest = {
  fileName: string;
  rows: {
    rowNumber: number;
    values: Record<string, string>;
  }[];
};

export type ImportFailedRow = {
  rowNumber: number;
  values: Record<string, string>;
  issues: string[];
};

export type ImportWarningRow = {
  rowNumber: number;
  values: Record<string, string>;
  warnings: string[];
};

export type ImportAssetsResponse = {
  successCount: number;
  failedCount: number;
  failedRows: ImportFailedRow[];
  warningRows: ImportWarningRow[];
  warnings: string[];
};

const importPreviewResponseSchema: JSONSchemaType<ImportPreviewResponse> = {
  type: "object",
  properties: {
    headers: { type: "array", items: { type: "string" } },
    rows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rowNumber: { type: "integer", minimum: 1 },
          values: {
            type: "object",
            required: [],
            additionalProperties: { type: "string" }
          },
          issues: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } },
          valid: { type: "boolean" }
        },
        required: ["rowNumber", "values", "issues", "warnings", "valid"],
        additionalProperties: false
      }
    },
    validCount: { type: "integer", minimum: 0 },
    invalidCount: { type: "integer", minimum: 0 },
    headerValid: { type: "boolean" },
    headerMessage: { type: "string" },
    warnings: { type: "array", items: { type: "string" } }
  },
  required: ["headers", "rows", "validCount", "invalidCount", "headerValid", "headerMessage", "warnings"],
  additionalProperties: false
};

const importAssetsResponseSchema: JSONSchemaType<ImportAssetsResponse> = {
  type: "object",
  properties: {
    successCount: { type: "integer", minimum: 0 },
    failedCount: { type: "integer", minimum: 0 },
    failedRows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rowNumber: { type: "integer", minimum: 1 },
          values: {
            type: "object",
            required: [],
            additionalProperties: { type: "string" }
          },
          issues: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["rowNumber", "values", "issues"],
        additionalProperties: false
      }
    },
    warningRows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rowNumber: { type: "integer", minimum: 1 },
          values: {
            type: "object",
            required: [],
            additionalProperties: { type: "string" }
          },
          warnings: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["rowNumber", "values", "warnings"],
        additionalProperties: false
      }
    },
    warnings: {
      type: "array",
      items: { type: "string" }
    },
  },
  required: ["successCount", "failedCount", "failedRows", "warningRows", "warnings"],
  additionalProperties: false
};

const validateImportPreviewResponse = ajv.compile(importPreviewResponseSchema);
const validateImportAssetsResponse = ajv.compile(importAssetsResponseSchema);

export async function previewImport(payload: ImportPreviewRequest) {
  const response = await post("/imports/preview", payload, validateImportPreviewResponse);
  return response;
}

export async function importAssets(payload: ImportAssetsRequest) {
  const response = await post("/imports", payload, validateImportAssetsResponse);
  return response;
}

export const NOTE_HEADERS = ["NOTES 1", "NOTES 2", "NOTES 3"] as const;

/**
 * CSV columns from the school's database export that are intentionally not imported.
 * These are suppressed from "unknown column" warnings so that importing the school's
 * full CSV does not generate noise for columns we have deliberately chosen to ignore.
 */
export const RECOGNIZED_IGNORED_HEADERS = [
  // Informational display columns (data lives in related tables)
  "BLDG DESCRIPTION",
  "CONDITION DESCRIPTION",
  "DEVICE TYPE DESC",
  // Ignored per field mapping decision
  "ACCT DESCRIPTION",
  "ACCT METHOD DESC",
  "ACCT TYPE",
  "DISP COST",
  "DISP DATE",
  "DISP METHOD",
  "NET BOOK VALUE",
  "NON-PROCUREMENT",
  "PAYING INDEX",
  "PROCEEDS",
  "REPLACEMENT FY",
  "STATUS",
  "T NUMBER",
  "TITLED TO",
  "TITLED TO DESC",
  "USER STATUS CODE",
  "USER STATUS CODE DESC",
  "VEHICLE TAG",
  "WARRANTY DATE",
  "WARRANTY NUMBER",
  "WIRED MAC ADDRESS",
  "WIRELESS MAC ADDRESS",
  "WSU VEHICLE ID",
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