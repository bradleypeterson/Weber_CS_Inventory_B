import type { JSONSchemaType } from "ajv";
import { ajv } from "../ajv";
import type { AddAssetParams } from "../db/procedures/assets";

const importSchema: JSONSchemaType<AddAssetParams> = {
  type: "object",
  properties: {
    TagNumber: { type: "string", maxLength: 16 },
    SerialNumber: { type: "string", maxLength: 32, nullable: true },
    Description: { type: "string", maxLength: 64, nullable: true },
    ContactPersonID: { type: "integer", minimum: 1, nullable: true },
    LocationID: { type: "integer", minimum: 1, nullable: true },
    DepartmentID: { type: "integer", minimum: 1, nullable: true },
    AssetClassID: { type: "integer", minimum: 1, nullable: true },
    FiscalYearID: { type: "integer", minimum: 1, nullable: true },
    ConditionID: { type: "integer", minimum: 1, nullable: true },
    DeviceTypeID: { type: "integer", minimum: 1, nullable: true },
    Manufacturer: { type: "string", maxLength: 50, nullable: true },
    PartNumber: { type: "string", maxLength: 50, nullable: true },
    Rapid7: { type: "boolean", nullable: true },
    CrowdStrike: { type: "boolean", nullable: true },
    ArchiveStatus: { type: "boolean", nullable: true },
    PONumber: { type: "string", maxLength: 50, nullable: true },
    SecondaryNumber: { type: "string", maxLength: 32, nullable: true },
    AccountingDate: { type: "string", nullable: true },
    AccountCost: { type: "number", minimum: 0, nullable: true },
    Model: { type: "string", maxLength: 100, nullable: true },
    Make: { type: "string", maxLength: 100, nullable: true },
    AssetType: { type: "string", maxLength: 50, nullable: true },
    AssetCreationDate: { type: "string", nullable: true },
    LastValidationDate: { type: "string", nullable: true },
    AcqCost: { type: "number", minimum: 0, nullable: true },
    AcqDate: { type: "string", nullable: true },
    AcqMethod: { type: "string", maxLength: 50, nullable: true },
    TotalCost: { type: "number", minimum: 0, nullable: true },
    EstReplacementCost: { type: "number", minimum: 0, nullable: true },
    DeptNum: { type: "string", maxLength: 20, nullable: true }
  },
  required: ["TagNumber"]
};

export const validateImportAssetRequest = ajv.compile(importSchema);