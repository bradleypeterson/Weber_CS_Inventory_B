export type AssetClass = {
  AssetClassID: number;
  Name: string;
  Abbreviation: string;
  Deleted?: number | null;
};

export type Building = {
  BuildingID: number;
  Name: string;
  Abbreviation: string;
  Deleted?: number | null;
};

export type Room = {
  LocationID: number;
  RoomNumber: string;
  BuildingID: number;
  Barcode: string;
  Deleted?: number | null;
};

export type Department = {
  DepartmentID: number;
  Name: string;
  Abbreviation: string;
  Deleted?: number | null;
};

export type Permission = {
  PermissionID: number;
  Name: string;
};

export type Asset = {
  EquipmentID: number;
  TagNumber: string;
  SerialNumber?: string | null;
  Description?: string | null;
  ContactPersonID?: number | null;
  LocationID?: number | null;
  DepartmentID?: number | null;
  AssetClassID?: number | null;
  FiscalYearID?: number | null;
  ConditionID?: number | null;
  DeviceTypeID?: number | null;
  Manufacturer?: string | null;
  PartNumber?: string | null;
  Rapid7?: 1 | 0 | null;
  CrowdStrike?: 1 | 0 | null;
  ArchiveStatus?: 1 | 0 | null;
  PONumber?: string | null;
  SecondaryNumber?: string | null;
  AccountingDate?: string | null;
  AccountCost?: number | null;
  Model?: string | null;
  Make?: string | null;
  AssetType?: string | null;
  AssetCreationDate?: string | null;
  LastValidationDate?: string | null;
  AcqCost?: number | null;
  AcqDate?: string | null;
  AcqMethod?: string | null;
  TotalCost?: number | null;
  EstReplacementCost?: number | null;
  DeptNum?: string | null;
};

export type AssetOverview = {
  EquipmentID: number;
  TagNumber: string;
  ContactPersonFirstName?: string | null;
  ContactPersonLastName?: string | null;
  DepartmentID?: number | null;
  Department?: string | null;
  AssetClassID?: number | null;
  AssetClass?: string | null;
  DeviceTypeID?: number | null;
  DeviceType?: string | null;
};

export type AssetDetails = {
  EquipmentID: number;
  TagNumber: string;
  SerialNumber?: string | null;
  Description?: string | null;
  DepartmentID?: number | null;
  DepartmentName?: string | null;
  BuildingID?: number | null;
  LocationID?: number | null;
  RoomNumber?: string | null;
  Barcode?: string | null;
  BuildingName?: string | null;
  BuildingAbbr?: string | null;
  ContactPersonID?: number | null;
  ContactPersonFirstName?: string | null;
  ContactPersonLastName?: string | null;
  AssetClassID?: number | null;
  AssetClassName?: string | null;
  FiscalYearID?: number | null;
  FiscalYear?: string | null;
  ConditionID?: number | null;
  ConditionName?: string | null;
  DeviceTypeID?: number | null;
  DeviceTypeName?: string | null;
  Manufacturer?: string | null;
  PartNumber?: string | null;
  Rapid7?: 1 | 0 | null;
  CrowdStrike?: 1 | 0 | null;
  ArchiveStatus?: 1 | 0 | null;
  PONumber?: string | null;
  SecondaryNumber?: string | null;
  AccountingDate?: string | null;
  AccountCost?: number | null;
  Model?: string | null;
  Make?: string | null;
  AssetType?: string | null;
  AssetCreationDate?: string | null;
  LastValidationDate?: string | null;
  AcqCost?: number | null;
  AcqDate?: string | null;
  AcqMethod?: string | null;
  TotalCost?: number | null;
  EstReplacementCost?: number | null;
  DeptNum?: string | null;
};

export type Contact = {
  WNumber: string;
  FullName?: string | null;
  FirstName: string;
  LastName: string;
  LocationID?: number | null;
  BuildingID?: number | null;
  Departments?: string | null;
  DepartmentID: number[];
};

export type ContactOverview = {
  PersonID: number;
  WNumber: string;
  FullName: string;
  Departments: string;
  Location: string;
  DepartmentID: number[];
};

export type User = {
  UserID: number;
  WNumber: string;
  Name: string;
  FirstName: string;
  LastName: string;
  BuildingID?: number | null;
  LocationID: number;
  Departments: string;
  DepartmentID: number[];
  Permissions: number[];
  Permission1: number;
  Permission2: number;
  Permission3: number;
  Permission4: number;
  Permission5: number;
  Permission6: number;
  Permission7: number;
};

export type UserOverview = {
  PersonID: number;
  UserID: number;
  WNumber: string;
  Name: string;
  Departments: string;
  Location: string;
  DepartmentID: number[];
  Permissions: number[];
};

export type Condition = {
  ConditionID: number;
  ConditionName: string;
  ConditionAbbreviation: string;
  Deleted?: number | null;
};

export type DeviceType = {
  DeviceTypeID: number;
  Name: string;
  Abbreviation: string;
  Deleted?: number | null;
};

export type FiscalYear = {
  ReplacementID: number;
  Year: string;
};

export type Note = {
  NoteID: number;
  CreatedBy: number;
  EquipmentID: number;
  Note: string;
  CreatedAt: string;
};