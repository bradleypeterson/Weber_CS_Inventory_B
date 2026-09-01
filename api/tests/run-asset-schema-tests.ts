import assert from "node:assert/strict";
import { validateAddAssetRequest } from "../src/assets/schemas";
import { validateImportAssetRequest } from "../src/imports/schemas";

type SchemaCase = {
  name: string;
  payload: Record<string, unknown>;
  expectAdd: boolean;
  expectImport: boolean;
};

const BASE_ADD_REQUIRED_FIELDS = {
  TagNumber: "TAG-2002",
  Description: "Latitude Laptop",
  BuildingID: 1,
  LocationID: 101,
  DepartmentID: 1,
  AssetClassID: 1,
  DeviceTypeID: 1,
  ConditionID: 1
} as const;

function assertSchemaCase(testCase: SchemaCase) {
  const addValid = validateAddAssetRequest(testCase.payload as any);
  assert.equal(addValid, testCase.expectAdd, `Add schema mismatch for case "${testCase.name}"`);

  const importValid = validateImportAssetRequest(testCase.payload as any);
  assert.equal(importValid, testCase.expectImport, `Import schema mismatch for case "${testCase.name}"`);
}

function run() {
  const requiredVsPermissiveCases: SchemaCase[] = [
    {
      name: "Tag-only payload stays permissive for import but strict for add",
      payload: { TagNumber: "TAG-1001" },
      expectAdd: false,
      expectImport: true
    },
    {
      name: "Add schema accepts required minimum field set",
      payload: { ...BASE_ADD_REQUIRED_FIELDS },
      expectAdd: true,
      expectImport: true
    },
    {
      name: "Missing TagNumber is rejected by both schemas",
      payload: { Description: "No tag" },
      expectAdd: false,
      expectImport: false
    }
  ];

  const boundaryCases: SchemaCase[] = [
    {
      name: "TagNumber length 16 is allowed",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        TagNumber: "1234567890ABCDEF"
      },
      expectAdd: true,
      expectImport: true
    },
    {
      name: "TagNumber length 17 is rejected",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        TagNumber: "1234567890ABCDEFG"
      },
      expectAdd: false,
      expectImport: false
    },
    {
      name: "Description length 64 is allowed",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        Description: "D".repeat(64)
      },
      expectAdd: true,
      expectImport: true
    },
    {
      name: "Description length 65 is rejected",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        Description: "D".repeat(65)
      },
      expectAdd: false,
      expectImport: false
    },
    {
      name: "DepartmentID below minimum is rejected",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        DepartmentID: 0
      },
      expectAdd: false,
      expectImport: false
    },
    {
      name: "Negative AccountCost is rejected",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        AccountCost: -1
      },
      expectAdd: false,
      expectImport: false
    }
  ];

  const nullableCases: SchemaCase[] = [
    {
      name: "Nullable fields with null values are accepted",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        SerialNumber: null,
        ContactPersonID: null,
        Manufacturer: null,
        AccountCost: null
      },
      expectAdd: true,
      expectImport: true
    }
  ];

  const invalidTypeCases: SchemaCase[] = [
    {
      name: "Rapid7 string is rejected (expects boolean)",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        Rapid7: "yes"
      },
      expectAdd: false,
      expectImport: false
    },
    {
      name: "ConditionID string is rejected (expects integer)",
      payload: {
        ...BASE_ADD_REQUIRED_FIELDS,
        ConditionID: "1"
      },
      expectAdd: false,
      expectImport: false
    }
  ];

  requiredVsPermissiveCases.forEach(assertSchemaCase);
  boundaryCases.forEach(assertSchemaCase);
  nullableCases.forEach(assertSchemaCase);
  invalidTypeCases.forEach(assertSchemaCase);

  console.log("All asset schema tests passed.");
}

run();
