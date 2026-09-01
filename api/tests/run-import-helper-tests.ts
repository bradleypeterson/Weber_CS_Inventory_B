import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import {
  buildSupportedHeaders,
  buildUnknownHeaderWarnings,
  extractRowNotes,
  getUnknownHeaders,
  NOTE_HEADERS,
  RECOGNIZED_IGNORED_HEADERS
} from "../src/imports/import-helpers";

const CURRENT_IMPORT_FIELD_SPEC_HEADERS: string[][] = [
  ["TAG NUMBER", "TagNumber"],
  ["SERIAL NUM/VIN", "SerialNumber"],
  ["DESCRIPTION", "Description"],
  ["CONTACT PERSON", "ContactPerson"],
  ["BLDG", "ROOM"],
  ["DEPARTMENT NAME", "DepartmentName"],
  ["DEPT NUM", "DeptNum"],
  ["ASSET CLASS", "AssetClassID"],
  ["CONDITION", "ConditionID"],
  ["DEVICE TYPE", "DeviceTypeID"],
  ["MANUFACTURER", "Manufacturer"],
  ["PART NUMBER", "PartNumber"],
  ["PO NUMBER", "PONumber"],
  ["SECONDARY NUMBER", "SecondaryNumber"],
  ["ACCT DATE", "AccountingDate"],
  ["ACCT COST", "AccountCost"],
  ["RAPID7", "Rapid7"],
  ["CROWDSTRIKE", "CrowdStrike"],
  ["MODEL", "Model"],
  ["MAKE", "Make"],
  ["ASSET TYPE", "AssetType"],
  ["ASSET CREATION DATE", "AssetCreationDate"],
  ["LAST VALIDATION DATE", "LastValidationDate"],
  ["ACQ COST", "AcqCost"],
  ["ACQ DATE", "AcqDate"],
  ["ACQ METHOD", "AcqMethod"],
  ["TOTAL COST", "TotalCost"],
  ["EST. REPLACEMENT COST", "EstReplacementCost"]
];

const EXPECTED_UNKNOWN_HEADERS_FROM_FIXTURE = [
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
  "WSU VEHICLE ID",
  "WARRANTY DATE",
  "WARRANTY NUMBER",
  "WIRED MAC ADDRESS",
  "WIRELESS MAC ADDRESS",
  "CUSTOM HEADER"
];

/**
 * Import helper regression checks.
 *
 * Why this exists:
 * - Protect CSV import header mapping behavior from accidental regressions.
 * - Ensure notes parsing contract remains exact ("NOTES 1/2/3").
 * - Ensure warning behavior is predictable for unknown vs recognized-ignored headers.
 *
 * How to run:
 * - From `api/`: `npm test`
 * - Test files in `api/tests` are auto-discovered by `tests/run-tests.ts`.
 *
 * Scope:
 * - This file intentionally tests pure helper behavior only (no DB access).
 */
function run() {
  // Verifies note extraction order and blank filtering.
  {
    const values = {
      "NOTES 1": "First note",
      "NOTES 2": "   ",
      "NOTES 3": "Third note"
    };
    const notes = extractRowNotes(values);
    assert.deepEqual(notes, ["First note", "Third note"]);
  }

  // Verifies we only accept the exact note headers, not near-miss variants.
  {
    const values = {
      "NOTE 1": "Not accepted",
      "NOTES 1": "Accepted",
      "Note 2": "Not accepted"
    };
    const notes = extractRowNotes(values);
    assert.deepEqual(notes, ["Accepted"]);
  }

  // Verifies unknown-header detection against a small supported header set.
  {
    const supportedHeaders = ["TAG NUMBER", "SERIAL NUM/VIN", "ASSET CLASS", "CONDITION", ...NOTE_HEADERS];
    const uploadHeaders = ["TAG NUMBER", "SERIAL NUM/VIN", "Custom Column", "NOTE 1", "NOTES 2"];
    const unknown = getUnknownHeaders(uploadHeaders, supportedHeaders);
    assert.deepEqual(unknown, ["Custom Column", "NOTE 1"]);
  }

  // Verifies warning message shape/content when unknown headers exist.
  {
    const warnings = buildUnknownHeaderWarnings(["Custom Column", "Legacy Field"]);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Custom Column/);
    assert.match(warnings[0], /Legacy Field/);
  }

  // Verifies no warnings when all headers are recognized.
  {
    const warnings = buildUnknownHeaderWarnings([]);
    assert.deepEqual(warnings, []);
  }

  // Fixture-backed regression check using a realistic full CSV row.
  // This protects expected behavior for:
  // - supported header recognition
  // - newly unsupported legacy headers staying visible in warnings
  // - recognized-but-ignored headers staying out of warnings
  // - unknown header warning generation
  // - NOTES 1/2/3 extraction
  {
    const fixturePath = path.join(__dirname, "fixtures", "import-full-row.csv");
    const fixtureText = fs.readFileSync(fixturePath, "utf-8");
    const rows = parse(fixtureText, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
    assert.equal(rows.length, 1);

    const row = rows[0];
    const headers = Object.keys(row);
    const supportedHeaders = buildSupportedHeaders(CURRENT_IMPORT_FIELD_SPEC_HEADERS);

    const unknown = getUnknownHeaders(headers, supportedHeaders);
    assert.deepEqual(unknown, EXPECTED_UNKNOWN_HEADERS_FROM_FIXTURE);

    const warnings = buildUnknownHeaderWarnings(unknown);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /ACCT DESCRIPTION/);
    assert.match(warnings[0], /CUSTOM HEADER/);

    const notes = extractRowNotes(row);
    assert.deepEqual(notes, ["First note", "Second note", "Third note"]);

    for (const ignored of RECOGNIZED_IGNORED_HEADERS) {
      assert.ok(headers.includes(ignored), `Fixture should include ignored header: ${ignored}`);
      assert.ok(!unknown.includes(ignored), `Ignored header should not be unknown: ${ignored}`);
    }
  }

  console.log("All import helper tests passed.");
}

run();
