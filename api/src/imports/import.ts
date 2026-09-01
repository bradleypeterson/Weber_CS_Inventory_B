import { parse } from "csv-parse/sync";
import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { getAssetAccessScope } from "../auth/assetScope";
import { validateUser } from "../auth/validateToken";
import { normalizeDateForDB } from "../date";
import { pool } from "../db";
import { addAsset, addAssetNote, type AddAssetParams } from "../db/procedures/assets";
import {
  buildSupportedHeaders,
  buildUnknownHeaderWarnings,
  extractRowNotes,
  getUnknownHeaders
} from "./import-helpers";
import { validateImportAssetRequest } from "./schemas";

/**
 * CSV import header reference (current supported columns)
 *
 * Required:
 * - TAG NUMBER (alias: TagNumber)
 *
 * Optional:
 * - SERIAL NUM/VIN (SerialNumber)
 * - DESCRIPTION (Description)
 * - CONTACT PERSON (ContactPerson)
 * - BLDG + ROOM — resolved against existing Location rows only; if no match,
 *   the asset is still imported without a LocationID and a row warning is shown
 * - DEPARTMENT NAME (DepartmentName)
 * - DEPT NUM (DeptNum)
 * - ASSET CLASS (AssetClassID; supports abbreviation like "CP")
 * - CONDITION (ConditionID; supports abbreviation like "GD")
 * - DEVICE TYPE (DeviceTypeID; supports abbreviation like "PC")
 * - MANUFACTURER (Manufacturer)
 * - PART NUMBER (PartNumber)
 * - PO NUMBER (PONumber)
 * - SECONDARY NUMBER (SecondaryNumber)
 * - ACCT DATE (AccountingDate)
 * - ACCT COST (AccountCost)
 * - ACQ COST (AcqCost)
 * - ACQ DATE (AcqDate)
 * - ACQ METHOD (AcqMethod)
 * - ASSET TYPE (AssetType)
 * - ASSET CREATION DATE (AssetCreationDate)
 * - LAST VALIDATION DATE (LastValidationDate)
 * - MAKE (Make)
 * - MODEL (Model)
 * - TOTAL COST (TotalCost)
 * - EST. REPLACEMENT COST (EstReplacementCost)
 * - NOTES 1, NOTES 2, NOTES 3 — captured in associative Note table
 *
 * Notes:
 * - Preview and import both use FIELD_SPECS below. Add/update fields there.
 * - Keep this comment in sync when FIELD_SPECS changes.
 */
type CsvRecord = Record<string, string>;

type ParsedCsvRow = {
  rowNumber: number;
  values: CsvRecord;
};

type ParsedCsv = {
  headers: string[];
  rows: ParsedCsvRow[];
};

type EvaluatedRow = {
  issues: string[];
  warnings: string[];
  params?: AddAssetParams;
};

type ReferenceData = {
  buildingByAbbreviation: Map<string, number>;
  assetClassByAbbreviation: Map<string, number>;
  conditionByAbbreviation: Map<string, number>;
  deviceTypeByAbbreviation: Map<string, number>;
  fiscalYearByYear: Map<string, number>;
  departmentByName: Map<string, number>;
  personByName: Map<string, number>;
  locationByBuildingRoom: Map<string, number>;
  existingTagSerialByTag: Map<string, string>;
};

type FieldParseResult = {
  value?: AddAssetParams[keyof AddAssetParams];
  issue?: string;
  warning?: string;
};

type FieldSpec = {
  field: keyof AddAssetParams;
  headers: string[];
  required?: boolean;
  parse: (values: CsvRecord, refs: ReferenceData) => FieldParseResult;
};

const FIELD_SPECS: FieldSpec[] = [
  {
    field: "TagNumber",
    headers: ["TAG NUMBER", "TagNumber"],
    required: true,
    parse: (values) => parseTextValue(values, ["TAG NUMBER", "TagNumber"], "TAG NUMBER", 16, true)
  },
  {
    field: "SerialNumber",
    headers: ["SERIAL NUM/VIN", "SerialNumber"],
    required: false,
    parse: (values) => parseTextValue(values, ["SERIAL NUM/VIN", "SerialNumber"], "SERIAL NUM/VIN", 32, false)
  },
  {
    field: "Description",
    headers: ["DESCRIPTION", "Description"],
    parse: (values) => parseTextValue(values, ["DESCRIPTION", "Description"], "DESCRIPTION", 64, false)
  },
  {
    field: "ContactPersonID",
    headers: ["CONTACT PERSON", "ContactPerson"],
    parse: (values, refs) => {
      const raw = getValue(values, ["CONTACT PERSON", "ContactPerson"]);
      if (raw === "") return {};
      const personId = refs.personByName.get(normalizeKey(raw));
      if (personId === undefined) {
        return {};
      }
      return { value: personId };
    }
  },
  {
    field: "LocationID",
    headers: ["BLDG", "ROOM"],
    parse: (values, refs) => {
      const { building, room, hasLocationValues } = getLocationInput(values);
      if (!hasLocationValues) return {};
      if (building === "" || room === "") {
        return { issue: "BLDG and ROOM must both be provided." };
      }
      const key = `${normalizeKey(building)}|${normalizeKey(room)}`;
      const locationId = refs.locationByBuildingRoom.get(key);
      if (locationId !== undefined) {
        return { value: locationId };
      }
      return {
        warning: `Location not found for BLDG "${building}" ROOM "${room}" — location will not be set on this asset.`
      };
    }
  },
  {
    field: "DepartmentID",
    headers: ["DEPARTMENT NAME", "DepartmentName"],
    parse: (values, refs) => {
      const raw = getValue(values, ["DEPARTMENT NAME", "DepartmentName"]);
      if (raw === "") return {};
      const departmentId = refs.departmentByName.get(normalizeKey(raw));
      if (departmentId === undefined) {
        return { issue: `Unknown DEPARTMENT NAME: ${raw}` };
      }
      return { value: departmentId };
    }
  },
  {
    field: "DeptNum",
    headers: ["DEPT NUM", "DeptNum"],
    parse: (values) => parseTextValue(values, ["DEPT NUM", "DeptNum"], "DEPT NUM", 16, false)
  },
  {
    field: "AssetClassID",
    headers: ["ASSET CLASS", "AssetClassID"],
    required: false,
    parse: (values, refs) => {
      const raw = getValue(values, ["ASSET CLASS", "AssetClassID"]);
      if (raw === "") return {};
      const parsedNumeric = parseInteger(raw);
      if (parsedNumeric !== undefined) return { value: parsedNumeric };
      const abbr = getLeadingToken(raw).toUpperCase();
      const id = refs.assetClassByAbbreviation.get(abbr);
      if (id === undefined) {
        return { issue: `Unknown ASSET CLASS: ${raw}` };
      }
      return { value: id };
    }
  },
  {
    field: "ConditionID",
    headers: ["CONDITION", "ConditionID"],
    required: false,
    parse: (values, refs) => {
      const raw = getValue(values, ["CONDITION", "ConditionID"]);
      if (raw === "") return { };
      const parsedNumeric = parseInteger(raw);
      if (parsedNumeric !== undefined) return { value: parsedNumeric };
      const id = refs.conditionByAbbreviation.get(raw.toUpperCase());
      if (id === undefined) {
        return { issue: `Unknown CONDITION: ${raw}` };
      }
      return { value: id };
    }
  },
  {
    field: "DeviceTypeID",
    headers: ["DEVICE TYPE", "DeviceTypeID"],
    required: false,
    parse: (values, refs) => {
      const raw = getValue(values, ["DEVICE TYPE", "DeviceTypeID"]);
      if (raw === "") return { };
      const parsedNumeric = parseInteger(raw);
      if (parsedNumeric !== undefined) return { value: parsedNumeric };
      const id = refs.deviceTypeByAbbreviation.get(raw.toUpperCase());
      if (id === undefined) {
        return { issue: `Unknown DEVICE TYPE: ${raw}` };
      }
      return { value: id };
    }
  },
  {
    field: "Manufacturer",
    headers: ["MANUFACTURER", "Manufacturer"],
    parse: (values) => parseTextValue(values, ["MANUFACTURER", "Manufacturer"], "MANUFACTURER", 64, false)
  },
  {
    field: "PartNumber",
    headers: ["PART NUMBER", "PartNumber"],
    parse: (values) => parseTextValue(values, ["PART NUMBER", "PartNumber"], "PART NUMBER", 50, false)
  },
  {
    field: "PONumber",
    headers: ["PO NUMBER", "PONumber"],
    parse: (values) => parseTextValue(values, ["PO NUMBER", "PONumber"], "PO NUMBER", 50, false)
  },
  {
    field: "SecondaryNumber",
    headers: ["SECONDARY NUMBER", "SecondaryNumber"],
    parse: (values) => parseTextValue(values, ["SECONDARY NUMBER", "SecondaryNumber"], "SECONDARY NUMBER", 32, false)
  },
  {
    field: "AccountingDate",
    headers: ["ACCT DATE", "AccountingDate"],
    parse: (values) => parseDateValue(values, ["ACCT DATE", "AccountingDate"], "ACCT DATE")
  },
  {
    field: "AccountCost",
    headers: ["ACCT COST", "AccountCost"],
    parse: (values) => parseMoneyValue(values, ["ACCT COST", "AccountCost"], "ACCT COST")
  },
  {
    field: "Rapid7",
    headers: ["RAPID7", "Rapid7"],
    parse: (values) => parseBooleanValue(values, ["RAPID7", "Rapid7"], "RAPID7")
  },
  {
    field: "CrowdStrike",
    headers: ["CROWDSTRIKE", "CrowdStrike"],
    parse: (values) => parseBooleanValue(values, ["CROWDSTRIKE", "CrowdStrike"], "CROWDSTRIKE")
  },
  {
    field: "Model",
    headers: ["MODEL", "Model"],
    parse: (values) => parseTextValue(values, ["MODEL", "Model"], "MODEL", 64, false)
  },
  {
    field: "Make",
    headers: ["MAKE", "Make"],
    parse: (values) => parseTextValue(values, ["MAKE", "Make"], "MAKE", 64, false)
  },
  {
    field: "AssetType",
    headers: ["ASSET TYPE", "AssetType"],
    parse: (values) => parseTextValue(values, ["ASSET TYPE", "AssetType"], "ASSET TYPE", 32, false)
  },
  {
    field: "AssetCreationDate",
    headers: ["ASSET CREATION DATE", "AssetCreationDate"],
    parse: (values) => parseDateValue(values, ["ASSET CREATION DATE", "AssetCreationDate"], "ASSET CREATION DATE")
  },
  {
    field: "LastValidationDate",
    headers: ["LAST VALIDATION DATE", "LastValidationDate"],
    parse: (values) => parseDateValue(values, ["LAST VALIDATION DATE", "LastValidationDate"], "LAST VALIDATION DATE")
  },
  {
    field: "AcqCost",
    headers: ["ACQ COST", "AcqCost"],
    parse: (values) => parseMoneyValue(values, ["ACQ COST", "AcqCost"], "ACQ COST")
  },
  {
    field: "AcqDate",
    headers: ["ACQ DATE", "AcqDate"],
    parse: (values) => parseDateValue(values, ["ACQ DATE", "AcqDate"], "ACQ DATE")
  },
  {
    field: "AcqMethod",
    headers: ["ACQ METHOD", "AcqMethod"],
    parse: (values) => parseTextValue(values, ["ACQ METHOD", "AcqMethod"], "ACQ METHOD", 32, false)
  },
  {
    field: "TotalCost",
    headers: ["TOTAL COST", "TotalCost"],
    parse: (values) => parseMoneyValue(values, ["TOTAL COST", "TotalCost"], "TOTAL COST")
  },
  {
    field: "EstReplacementCost",
    headers: ["EST. REPLACEMENT COST", "EstReplacementCost"],
    parse: (values) => parseMoneyValue(values, ["EST. REPLACEMENT COST", "EstReplacementCost"], "EST. REPLACEMENT COST")
  }
];
const REQUIRED_FIELD_SPECS = FIELD_SPECS.filter((spec) => spec.required);

// req.body contains: { fileName, fileContents}
export async function previewImportHandler(req: Request, res: Response) {
  try {
    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }
    if (!scope.isAdmin) {
      res.status(403).json({ status: "error", error: { message: "Admin permission is required for import." } });
      return;
    }

    const { fileName, fileContents } = req.body as {
      fileName?: unknown;
      fileContents?: unknown;
    };

    // Basic request validation
    if (typeof fileName !== "string" || typeof fileContents !== "string") {
      res.status(400).json({
        status: "error",
        error: { message: "Invalid request body. Expected { fileName, fileContents }." }
      });
      return;
    }

    const parsedCsv = parseCsv(fileContents);
    const missingRequiredHeaders = getMissingRequiredHeaders(parsedCsv.headers);
    const unknownHeaders = getUnknownHeaders(parsedCsv.headers, getSupportedHeaders());
    const warnings = buildUnknownHeaderWarnings(unknownHeaders);
    const headerValid = missingRequiredHeaders.length === 0;
    const headerMessage = headerValid
      ? "Header is valid."
      : `Missing required header(s): ${missingRequiredHeaders.join(", ")}`;

    if (!headerValid) {
      res.json({
        status: "success",
        data: {
          headers: parsedCsv.headers,
          rows: [],
          validCount: 0,
          invalidCount: 0,
          headerValid,
          headerMessage,
          warnings
        }
      });
      return;
    }

    const refs = await loadReferenceData();
    const seenTags = new Set<string>();
    const rows = parsedCsv.rows.map((row) => {
      const evaluation = evaluateRow(row.values, refs, seenTags);
      const issues = evaluation.issues;
      return {
        rowNumber: row.rowNumber,
        values: row.values,
        issues,
        warnings: evaluation.warnings,
        valid: issues.length === 0
      };
    });

    const validCount = rows.filter((row) => row.valid).length;
    const invalidCount = rows.length - validCount;
    const preview = {
      headers: parsedCsv.headers,
      rows,
      validCount,
      invalidCount,
      headerValid,
      headerMessage,
      warnings
    };

    // Success wrapper shape expected by frontend helpers (web/src/api/helpers.ts)
    res.json({
      status: "success",
      data: preview // what's being passed back to the front end
    });
  } catch (error) {
    console.error("previewImportHandler failed:", error);
    // Failure error shape expected by frontend helpers (web/src/api/helpers.ts)
    res.status(500).json({
      status: "error",
      error: { message: "Unable to preview import file." }
    });
  }
}

// req.body contains: { fileName, rows: [{ rowNumber, values }] }
export async function importAssetsHandler(req: Request, res: Response) {
  try {
    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }
    if (!scope.isAdmin) {
      res.status(403).json({ status: "error", error: { message: "Admin permission is required for import." } });
      return;
    }

    const { fileName, rows } = req.body as {
      fileName? : unknown,
      rows? : unknown
    };

    if (typeof fileName !== "string" || !Array.isArray(rows)) {
      res.status(400).json({
        status: "error",
        error: { message: "Invalid request body. Expected { fileName, rows }." }
      });
      return;
    }

    const createdBy = getImportUserId(res.locals.user);
    const refs = await loadReferenceData();
    const seenTags = new Set<string>();
    const uploadHeaders = getHeadersFromIncomingRows(rows);
    const unknownHeaders = getUnknownHeaders(uploadHeaders, getSupportedHeaders());
    const warnings = buildUnknownHeaderWarnings(unknownHeaders);

    let successCount = 0;
    const failedRows: { rowNumber: number; values: Record<string, string>; issues: string[] }[] = [];
    const warningRows: { rowNumber: number; values: Record<string, string>; warnings: string[] }[] = [];

    for (const row of rows) {
      const normalized = normalizeIncomingRow(row);
      if (normalized === undefined) {
        continue;
      }

      const evaluation = evaluateRow(normalized.values, refs, seenTags);
      if (evaluation.issues.length > 0 || evaluation.params === undefined) {
        failedRows.push({
          rowNumber: normalized.rowNumber,
          values: normalized.values,
          issues: evaluation.issues.length > 0 ? evaluation.issues : ["Invalid row data."]
        });
        continue;
      }

      try {
        const rowNotes = extractRowNotes(normalized.values);
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          const insertResult = await addAsset(evaluation.params, connection);
          const equipmentId = insertResult.insertId;

          for (const note of rowNotes) {
            await addAssetNote(createdBy, equipmentId, note, connection);
          }

          await connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }

        successCount += 1;

        if (evaluation.warnings.length > 0) {
          warningRows.push({
            rowNumber: normalized.rowNumber,
            values: normalized.values,
            warnings: evaluation.warnings
          });
        }

        const tag = normalizeKey(evaluation.params.TagNumber);
        refs.existingTagSerialByTag.set(tag, normalizeKey(evaluation.params.SerialNumber ?? ""));
      } catch (error) {
        console.error("importAssetsHandler row insert failed:", error);
        failedRows.push({
          rowNumber: normalized.rowNumber,
          values: normalized.values,
          issues: ["Failed to insert row into database."]
        });
      }
    }

    const results = {
      successCount,
      failedCount: failedRows.length,
      failedRows,
      warningRows,
      warnings
    };

    // Success wrapper shape expected by frontend helpers (web/src/api/helpers.ts)
    res.json({
      status: "success",
      data: results // what's being passed back to the front end
    });
  } catch (error) {
    console.error("importAssetsHandler failed:", error);
    // Failure error shape expected by frontend helpers (web/src/api/helpers.ts)
    res.status(500).json({
      status: "error",
      error: { message: "Unable to import assets." }
    });
  }
}

function parseCsv(fileContents: string): ParsedCsv {
  const matrix = parse(fileContents, {
    trim: true,
    skip_empty_lines: true,
    bom: true
  }) as string[][];

  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = matrix[0].map((value) => String(value).trim());
  const rows = matrix.slice(1).map((cells, index) => {
    const values: CsvRecord = {};
    headers.forEach((header, headerIndex) => {
      values[header] = String(cells[headerIndex] ?? "").trim();
    });
    return {
      rowNumber: index + 2,
      values
    };
  });

  return { headers, rows };
}

function getMissingRequiredHeaders(headers: string[]) {
  const present = new Set(headers.map((header) => normalizeKey(header)));
  const missing = REQUIRED_FIELD_SPECS
    .filter((spec) => !spec.headers.some((header) => present.has(normalizeKey(header))))
    .map((spec) => spec.headers[0]);
  return missing;
}

function getSupportedHeaders() {
  return buildSupportedHeaders(FIELD_SPECS.map((spec) => spec.headers));
}

function getHeadersFromIncomingRows(rows: unknown[]) {
  const headers = new Set<string>();
  for (const row of rows) {
    const normalized = normalizeIncomingRow(row);
    if (normalized === undefined) continue;
    Object.keys(normalized.values).forEach((key) => headers.add(key));
  }
  return [...headers];
}

function getImportUserId(user: unknown) {
  if (validateUser(user)) {
    return (user as { UserID: number }).UserID;
  }
  return 1;
}

function normalizeIncomingRow(row: unknown): ParsedCsvRow | undefined {
  if (row === null || typeof row !== "object") return undefined;

  const rowData = row as { rowNumber?: unknown; values?: unknown };
  if (typeof rowData.rowNumber !== "number" || Number.isNaN(rowData.rowNumber)) return undefined;
  if (rowData.values === null || typeof rowData.values !== "object") return undefined;

  const values = Object.entries(rowData.values as Record<string, unknown>).reduce<CsvRecord>((acc, [key, value]) => {
    if (typeof value === "string") {
      acc[key] = value.trim();
    } else if (value === null || value === undefined) {
      acc[key] = "";
    } else {
      acc[key] = String(value).trim();
    }
    return acc;
  }, {});

  return { rowNumber: rowData.rowNumber, values };
}

function evaluateRow(values: CsvRecord, refs: ReferenceData, seenTags: Set<string>): EvaluatedRow {
  const issues: string[] = [];
  const parsed = toAddAssetParams(values, refs);
  issues.push(...parsed.issues);

  if (parsed.params !== undefined) {
    const tagKey = normalizeKey(parsed.params.TagNumber);

    if (seenTags.has(tagKey)) {
      issues.push(`Duplicate TAG NUMBER in upload: ${parsed.params.TagNumber}`);
    } else {
      seenTags.add(tagKey);
    }

    if (refs.existingTagSerialByTag.has(tagKey)) {
      issues.push(`Duplicate TAG NUMBER: ${parsed.params.TagNumber}`);
    }
  }

  const dedupedIssues = [...new Set(issues)];
  if (dedupedIssues.length > 0) {
    return { issues: dedupedIssues, warnings: parsed.warnings };
  }

  return { issues: [], warnings: parsed.warnings, params: parsed.params };
}

function toAddAssetParams(values: CsvRecord, refs: ReferenceData): { params?: AddAssetParams; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  const params: Partial<AddAssetParams> = {};

  for (const spec of FIELD_SPECS) {
    const result = spec.parse(values, refs);
    if (result.issue !== undefined) {
      issues.push(result.issue);
      continue;
    }
    if (result.warning !== undefined) {
      warnings.push(result.warning);
      continue;
    }
    if (result.value !== undefined) {
      (params as Record<string, unknown>)[spec.field] = result.value;
    }
  }

  if (issues.length > 0) {
    return { issues, warnings };
  }

  const candidate = params as AddAssetParams;
  if (validateImportAssetRequest(candidate) === false) {
    const schemaIssues = (validateImportAssetRequest.errors ?? []).map((error) => {
      if (error.instancePath !== "") {
        return `${error.instancePath.slice(1)} ${error.message ?? "is invalid"}`;
      }
      return error.message ?? "Invalid row.";
    });
    return { issues: schemaIssues.length > 0 ? schemaIssues : ["Invalid row data."], warnings };
  }

  return { params: candidate, issues: [], warnings };
}

function parseTextValue(
  values: CsvRecord,
  headers: string[],
  label: string,
  maxLength: number,
  required: boolean
): FieldParseResult {
  const raw = getValue(values, headers);
  if (raw === "") {
    if (required) return { issue: `Missing ${label}.` };
    return {};
  }
  if (raw.length > maxLength) {
    return { issue: `${label} exceeds max length ${maxLength}.` };
  }
  return { value: raw };
}

function parseDateValue(values: CsvRecord, headers: string[], label: string): FieldParseResult {
  const raw = getValue(values, headers);
  if (raw === "") return {};
  try {
    return { value: normalizeDateForDB(raw) };
  } catch {
    return { issue: `Invalid ${label}: ${raw}` };
  }
}

function parseMoneyValue(
  values: CsvRecord,
  headers: string[],
  label: string,
  requireNonNegative: boolean = true
): FieldParseResult {
  const raw = getValue(values, headers);
  if (raw === "") return {};
  const normalized = raw.replace(/[$,]/g, "");
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { issue: `Invalid ${label}: ${raw}` };
  }
  if (requireNonNegative && value < 0) {
    return { issue: `Invalid ${label}: ${raw}` };
  }
  return { value };
}

function parseBooleanValue(values: CsvRecord, headers: string[], label: string): FieldParseResult {
  const raw = getValue(values, headers);
  if (raw === "") return {};
  const normalized = normalizeKey(raw);
  if (["yes", "true", "1", "y"].includes(normalized)) return { value: true };
  if (["no", "false", "0", "n"].includes(normalized)) return { value: false };
  return { issue: `Invalid ${label}: ${raw}` };
}

function getValue(values: CsvRecord, headers: string[]) {
  for (const header of headers) {
    if (Object.hasOwn(values, header)) {
      return values[header].trim();
    }
  }
  return "";
}

function parseInteger(value: string) {
  if (!/^\d+$/.test(value.trim())) return undefined;
  return Number(value.trim());
}

function getLeadingToken(value: string) {
  const normalized = value.trim();
  const parts = normalized.split(/[\s-]+/);
  return parts[0] ?? normalized;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getLocationInput(values: CsvRecord) {
  const building = getValue(values, ["BLDG"]);
  const room = getValue(values, ["ROOM"]);
  const hasLocationValues = building !== "" || room !== "";
  return { building, room, hasLocationValues };
}

interface AbbreviationRow extends RowDataPacket {
  id: number;
  abbreviation: string;
}

interface BuildingRow extends RowDataPacket {
  BuildingID: number;
  Abbreviation: string;
}

interface DepartmentRow extends RowDataPacket {
  DepartmentID: number;
  Name: string;
}

interface FiscalYearRow extends RowDataPacket {
  ReplacementID: number;
  Year: string;
}

interface PersonRow extends RowDataPacket {
  PersonID: number;
  FirstName: string;
  LastName: string;
}

interface LocationRow extends RowDataPacket {
  LocationID: number;
  BuildingAbbreviation: string;
  RoomNumber: string;
}

interface ExistingTagRow extends RowDataPacket {
  TagNumber: string;
  SerialNumber: string;
}

async function loadReferenceData(): Promise<ReferenceData> {
  const [
    [buildingRows],
    [assetClassRows],
    [conditionRows],
    [deviceTypeRows],
    [fiscalYearRows],
    [departmentRows],
    [personRows],
    [locationRows],
    [existingTagRows]
  ] = await Promise.all([
    pool.query<BuildingRow[]>(
      "SELECT BuildingID, Abbreviation FROM Building WHERE Deleted = 0 OR Deleted IS NULL"
    ),
    pool.query<AbbreviationRow[]>(
      "SELECT AssetClassID as id, Abbreviation as abbreviation FROM AssetClass WHERE Deleted = 0 OR Deleted IS NULL"
    ),
    pool.query<AbbreviationRow[]>(
      "SELECT ConditionID as id, ConditionAbbreviation as abbreviation FROM `Condition` WHERE Deleted = 0 OR Deleted IS NULL"
    ),
    pool.query<AbbreviationRow[]>(
      "SELECT DeviceTypeID as id, Abbreviation as abbreviation FROM DeviceType WHERE Deleted = 0 OR Deleted IS NULL"
    ),
    pool.query<FiscalYearRow[]>(
      "SELECT ReplacementID, Year FROM ReplacementFiscalYear WHERE Deleted = 0 OR Deleted IS NULL"
    ),
    pool.query<DepartmentRow[]>(
      "SELECT DepartmentID, Name FROM Department WHERE Deleted = 0 OR Deleted IS NULL"
    ),
    pool.query<PersonRow[]>(
      "SELECT PersonID, FirstName, LastName FROM Person WHERE Deleted = 0 OR Deleted IS NULL"
    ),
    pool.query<LocationRow[]>(
      `SELECT l.LocationID, b.Abbreviation as BuildingAbbreviation, l.RoomNumber
       FROM Location l
       JOIN Building b ON b.BuildingID = l.BuildingID
       WHERE (l.Deleted = 0 OR l.Deleted IS NULL) AND (b.Deleted = 0 OR b.Deleted IS NULL)`
    ),
    pool.query<ExistingTagRow[]>(
      "SELECT TagNumber, SerialNumber FROM Equipment WHERE Deleted = 0 OR Deleted IS NULL"
    )
  ]);

  const buildingByAbbreviation = new Map<string, number>();
  buildingRows.forEach((row) => {
    buildingByAbbreviation.set(normalizeKey(row.Abbreviation), row.BuildingID);
  });

  const assetClassByAbbreviation = new Map<string, number>();
  assetClassRows.forEach((row) => {
    assetClassByAbbreviation.set(row.abbreviation.toUpperCase(), row.id);
  });

  const conditionByAbbreviation = new Map<string, number>();
  conditionRows.forEach((row) => {
    conditionByAbbreviation.set(row.abbreviation.toUpperCase(), row.id);
  });

  const deviceTypeByAbbreviation = new Map<string, number>();
  deviceTypeRows.forEach((row) => {
    deviceTypeByAbbreviation.set(row.abbreviation.toUpperCase(), row.id);
  });

  const fiscalYearByYear = new Map<string, number>();
  fiscalYearRows.forEach((row) => {
    fiscalYearByYear.set(normalizeKey(row.Year), row.ReplacementID);
  });

  const departmentByName = new Map<string, number>();
  departmentRows.forEach((row) => {
    departmentByName.set(normalizeKey(row.Name), row.DepartmentID);
  });

  const personByName = new Map<string, number>();
  personRows.forEach((row) => {
    personByName.set(normalizeKey(`${row.FirstName} ${row.LastName}`), row.PersonID);
  });

  const locationByBuildingRoom = new Map<string, number>();
  locationRows.forEach((row) => {
    locationByBuildingRoom.set(`${normalizeKey(row.BuildingAbbreviation)}|${normalizeKey(row.RoomNumber)}`, row.LocationID);
  });

  const existingTagSerialByTag = new Map<string, string>();
  existingTagRows.forEach((row) => {
    existingTagSerialByTag.set(normalizeKey(row.TagNumber), normalizeKey(row.SerialNumber ?? ""));
  });

  return {
    buildingByAbbreviation,
    assetClassByAbbreviation,
    conditionByAbbreviation,
    deviceTypeByAbbreviation,
    fiscalYearByYear,
    departmentByName,
    personByName,
    locationByBuildingRoom,
    existingTagSerialByTag
  };
}
