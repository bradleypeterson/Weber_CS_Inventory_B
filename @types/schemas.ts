// Lightweight JSONSchemaType alias so @types does not depend on ajv at build time.
// This is sufficient for typing the schema objects used by api/web code.
type JSONSchemaType<_T> = { [key: string]: any };
import type {
  Asset,
  AssetDetails,
  AssetOverview,
  Condition,
  Contact,
  ContactOverview,
  DeviceType,
  FiscalYear,
  Note,
  User,
  UserOverview,
} from "./data";

export const assetSchema: JSONSchemaType<Asset> = {
  type: "object",
  properties: {
    EquipmentID: { type: "number" },
    TagNumber: { type: "string" },
    SerialNumber: { type: "string", nullable: true },
    Description: { type: "string", nullable: true },
    ContactPersonID: { type: "number", nullable: true },
    LocationID: { type: "number", nullable: true },
    DepartmentID: { type: "number", nullable: true },
    AssetClassID: { type: "number", nullable: true },
    FiscalYearID: { type: "number", nullable: true },
    ConditionID: { type: "number", nullable: true },
    DeviceTypeID: { type: "number", nullable: true },
    Manufacturer: { type: "string", nullable: true },
    PartNumber: { type: "string", nullable: true },
    Rapid7: { type: "number", enum: [1, 0], nullable: true },
    CrowdStrike: { type: "number", enum: [1, 0], nullable: true },
    ArchiveStatus: { type: "number", enum: [1, 0], nullable: true },
    PONumber: { type: "string", nullable: true },
    SecondaryNumber: { type: "string", nullable: true },
    AccountingDate: { type: "string", nullable: true },
    AccountCost: { type: "number", nullable: true },
    Model: { type: "string", nullable: true },
    Make: { type: "string", nullable: true },
    AssetType: { type: "string", nullable: true },
    AssetCreationDate: { type: "string", nullable: true },
    LastValidationDate: { type: "string", nullable: true },
    AcqCost: { type: "number", nullable: true },
    AcqDate: { type: "string", nullable: true },
    AcqMethod: { type: "string", nullable: true },
    TotalCost: { type: "number", nullable: true },
    EstReplacementCost: { type: "number", nullable: true },
    DeptNum: { type: "string", nullable: true },
  },
  required: [
    "EquipmentID",
    "TagNumber",
  ],
  additionalProperties: false,
};

export const assetArraySchema: JSONSchemaType<Asset[]> = {
  type: "array",
  items: assetSchema,
};

export const assetOverviewSchema: JSONSchemaType<AssetOverview> = {
  type: "object",
  properties: {
    EquipmentID: { type: "number" },
    TagNumber: { type: "string" },
    ContactPersonFirstName: { type: "string", nullable: true },
    ContactPersonLastName: { type: "string", nullable: true },
    DepartmentID: { type: "number", nullable: true },
    Department: { type: "string", nullable: true },
    AssetClassID: { type: "number", nullable: true },
    AssetClass: { type: "string", nullable: true },
    DeviceTypeID: { type: "number", nullable: true },
    DeviceType: { type: "string", nullable: true },
  },
  required: [
    "EquipmentID",
    "TagNumber",
  ],
};

export const assetOverviewArraySchema: JSONSchemaType<AssetOverview[]> = {
  type: "array",
  items: assetOverviewSchema,
};

export const assetDetailsSchema: JSONSchemaType<AssetDetails> = {
  type: "object",
  properties: {
    EquipmentID: { type: "number" },
    TagNumber: { type: "string" },
    SerialNumber: { type: "string", nullable: true },
    Description: { type: "string", nullable: true },
    DepartmentID: { type: "number", nullable: true },
    DepartmentName: { type: "string", nullable: true },
    BuildingID: { type: "number", nullable: true },
    LocationID: { type: "number", nullable: true },
    RoomNumber: { type: "string", nullable: true },
    Barcode: { type: "string", nullable: true },
    BuildingName: { type: "string", nullable: true },
    BuildingAbbr: { type: "string", nullable: true },
    ContactPersonID: { type: "number", nullable: true },
    ContactPersonFirstName: { type: "string", nullable: true },
    ContactPersonLastName: { type: "string", nullable: true },
    AssetClassID: { type: "number", nullable: true },
    AssetClassName: { type: "string", nullable: true },
    FiscalYearID: { type: "number", nullable: true },
    FiscalYear: { type: "string", nullable: true },
    ConditionID: { type: "number", nullable: true },
    ConditionName: { type: "string", nullable: true },
    DeviceTypeID: { type: "number", nullable: true },
    DeviceTypeName: { type: "string", nullable: true },
    Manufacturer: { type: "string", nullable: true },
    PartNumber: { type: "string", nullable: true },
    Rapid7: { type: "number", enum: [1, 0], nullable: true },
    CrowdStrike: { type: "number", enum: [1, 0], nullable: true },
    ArchiveStatus: { type: "number", enum: [1, 0], nullable: true },
    PONumber: { type: "string", nullable: true },
    SecondaryNumber: { type: "string", nullable: true },
    AccountingDate: { type: "string", nullable: true },
    AccountCost: { type: "number", nullable: true },
    Model: { type: "string", nullable: true },
    Make: { type: "string", nullable: true },
    AssetType: { type: "string", nullable: true },
    AssetCreationDate: { type: "string", nullable: true },
    LastValidationDate: { type: "string", nullable: true },
    AcqCost: { type: "number", nullable: true },
    AcqDate: { type: "string", nullable: true },
    AcqMethod: { type: "string", nullable: true },
    TotalCost: { type: "number", nullable: true },
    EstReplacementCost: { type: "number", nullable: true },
    DeptNum: { type: "string", nullable: true },
  },
  required: [
    "EquipmentID",
    "TagNumber",
  ],
  additionalProperties: false,
};

export const assetDetailsArraySchema: JSONSchemaType<AssetDetails[]> = {
  type: "array",
  items: assetDetailsSchema,
};

export const assetLookupByTagSchema: JSONSchemaType<{ assetId: number }> = {
  type: "object",
  properties: {
    assetId: { type: "number" }
  },
  required: ["assetId"],
  additionalProperties: false
};

export const contactSchema: JSONSchemaType<Contact> = {
  type: "object",
  properties: {
    WNumber: { type: "string" },
    FullName: { type: "string", nullable: true },
    FirstName: { type: "string" },
    LastName: { type: "string" },
    LocationID: { type: "number", nullable: true },
    BuildingID: { type: "number", nullable: true },
    Departments: { type: "string", nullable: true },
    DepartmentID: { type: "array", items: { type: "number" } },
  },
  required: ["WNumber", "FirstName", "LastName", "DepartmentID"],
};

export const contactArraySchema: JSONSchemaType<Contact[]> = {
  type: "array",
  items: contactSchema,
};

export const contactOverviewSchema: JSONSchemaType<ContactOverview> = {
  type: "object",
  properties: {
    PersonID: { type: "number" },
    WNumber: { type: "string" },
    FullName: { type: "string" },
    Departments: { type: "string" },
    Location: { type: "string" },
    DepartmentID: { type: "array", items: { type: "number" } },
  },
  required: [
    "PersonID",
    "WNumber",
    "FullName",
    "Departments",
    "Location",
    "DepartmentID",
  ],
};

export const contactOverviewArraySchema: JSONSchemaType<ContactOverview[]> = {
  type: "array",
  items: contactOverviewSchema,
};

export const userOverviewSchema: JSONSchemaType<UserOverview> = {
  type: "object",
  properties: {
    UserID: { type: "number" },
    PersonID: { type: "number" },
    WNumber: { type: "string" },
    Name: { type: "string" },
    Departments: { type: "string" },
    Location: { type: "string" },
    DepartmentID: { type: "array", items: { type: "number" } },
    Permissions: { type: "array", items: { type: "number" } },
  },
  required: [
    "UserID",
    "PersonID",
    "WNumber",
    "Name",
    "Departments",
    "Location",
    "DepartmentID",
    "Permissions",
  ],
};

export const userOverviewArraySchema: JSONSchemaType<UserOverview[]> = {
  type: "array",
  items: userOverviewSchema,
};

export const userSchema: JSONSchemaType<User> = {
  type: "object",
  properties: {
    UserID: { type: "number" },
    WNumber: { type: "string" },
    Name: { type: "string" },
    FirstName: { type: "string" },
    LastName: { type: "string" },
    BuildingID: { type: "number", nullable: true },
    LocationID: { type: "number" },
    Departments: { type: "string" },
    DepartmentID: { type: "array", items: { type: "number" } },
    Permissions: { type: "array", items: { type: "number" } },
    Permission1: { type: "number" },
    Permission2: { type: "number" },
    Permission3: { type: "number" },
    Permission4: { type: "number" },
    Permission5: { type: "number" },
    Permission6: { type: "number" },
    Permission7: { type: "number" },
  },
  required: [
    "UserID",
    "WNumber",
    "Name",
    "FirstName",
    "LastName",
    "LocationID",
    "Departments",
    "DepartmentID",
    "Permissions",
    "Permission1",
    "Permission2",
    "Permission3",
    "Permission4",
    "Permission5",
    "Permission6",
    "Permission7",
  ],
};

export const userArraySchema: JSONSchemaType<User[]> = {
  type: "array",
  items: userSchema,
};

export const conditionSchema: JSONSchemaType<Condition> = {
  type: "object",
  properties: {
    ConditionID: { type: "number" },
    ConditionName: { type: "string" },
    ConditionAbbreviation: { type: "string" },
  },
  required: ["ConditionAbbreviation", "ConditionID", "ConditionName"],
};

export const conditionArraySchema: JSONSchemaType<Condition[]> = {
  type: "array",
  items: conditionSchema,
};

export const deviceTypeSchema: JSONSchemaType<DeviceType> = {
  type: "object",
  properties: {
    DeviceTypeID: { type: "number" },
    Name: { type: "string" },
    Abbreviation: { type: "string" },
  },
  required: ["DeviceTypeID", "Name", "Abbreviation"],
};

export const deviceTypeArraySchema: JSONSchemaType<DeviceType[]> = {
  type: "array",
  items: deviceTypeSchema,
};

export const fiscalYearSchema: JSONSchemaType<FiscalYear> = {
  type: "object",
  properties: {
    ReplacementID: { type: "number" },
    Year: { type: "string" },
  },
  required: ["Year", "ReplacementID"],
};

export const fiscalYearArraySchema: JSONSchemaType<FiscalYear[]> = {
  type: "array",
  items: fiscalYearSchema,
};

export const noteSchema: JSONSchemaType<Note> = {
  type: "object",
  properties: {
    NoteID: { type: "number" },
    CreatedBy: { type: "number" },
    EquipmentID: { type: "number" },
    Note: { type: "string" },
    CreatedAt: { type: "string" },
  },
  required: ["NoteID", "CreatedAt", "CreatedBy", "EquipmentID", "Note"],
};

export const notesSchema: JSONSchemaType<Note[]> = {
  type: "array",
  items: noteSchema,
};