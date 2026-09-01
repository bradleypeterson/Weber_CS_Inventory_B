import { ajv } from "../ajv";
import type { AddAssetParams } from "../db/procedures/assets";


export type AddAssetRequest = AddAssetParams & {
  BuildingID: number;
};

// Does not use policy schema because it has different/stricter requirements
// to constrain data validation for nonadmin-user-facing tools.
const addSchema = {
  type: "object",
  properties: {
    TagNumber: { type: "string", maxLength: 16 },
    SerialNumber: { type: "string", maxLength: 32, nullable: true },
    Description: { type: "string", maxLength: 64 },
    ContactPersonID: { type: "integer", minimum: 1, nullable: true },
    BuildingID: { type: "integer", minimum: 1 },
    LocationID: { type: "integer", minimum: 1 },
    DepartmentID: { type: "integer", minimum: 1 },
    AssetClassID: { type: "integer", minimum: 1 },
    FiscalYearID: { type: "integer", minimum: 1, nullable: true },
    ConditionID: { type: "integer", minimum: 1 },
    DeviceTypeID: { type: "integer", minimum: 1 },
    Manufacturer: { type: "string", maxLength: 64, nullable: true },
    PartNumber: { type: "string", maxLength: 50, nullable: true },
    Rapid7: { type: "boolean", nullable: true },
    CrowdStrike: { type: "boolean", nullable: true },
    ArchiveStatus: { type: "boolean", nullable: true },
    PONumber: { type: "string", maxLength: 50, nullable: true },
    SecondaryNumber: { type: "string", maxLength: 32, nullable: true },
    AccountingDate: { type: "string", nullable: true },
    AccountCost: { type: "number", minimum: 0, nullable: true },
    Model: { type: "string", maxLength: 64, nullable: true },
    Make: { type: "string", maxLength: 64, nullable: true },
    AssetType: { type: "string", maxLength: 32, nullable: true },
    AssetCreationDate: { type: "string", nullable: true },
    LastValidationDate: { type: "string", nullable: true },
    AcqCost: { type: "number", minimum: 0, nullable: true },
    AcqDate: { type: "string", nullable: true },
    AcqMethod: { type: "string", maxLength: 32, nullable: true },
    TotalCost: { type: "number", minimum: 0, nullable: true },
    EstReplacementCost: { type: "number", minimum: 0, nullable: true },
    DeptNum: { type: "string", maxLength: 16, nullable: true }
  },
  required: [
    "TagNumber",
    "BuildingID",
    "LocationID",
    "DepartmentID",
    "AssetClassID",
    "DeviceTypeID",
    "ConditionID"
  ]
} as const;

export const validateAddAssetRequest = ajv.compile<AddAssetRequest>(addSchema as any);