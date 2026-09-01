import type { ReactNode } from "react";
import { AssetClassFilter } from "./AssetClassFilter/AssetClassFilter";
import { AuditorFilter } from "./AuditorFilter/AuditorFilter";
import { BuildingFilter } from "./BuildingFilter/BuildingFilter";
import { DateFilter } from "./DateFilter/DateFilter";
import { DepartmentFilter } from "./DepartmentFilter/DepartmentFilter";
import { EntityTypeFilter } from "./EntityTypeFilter/EntityTypeFilter";
import { PermissionsFilter } from "./PermissionsFilter/PermissionsFilter";
import { PerformedByFilter } from "./PerformedByFilter/PerformedByFilter";
import { RoomFilter } from "./RoomFilter/RoomFilter";
import { StatusFilter } from "./StatusFilter/StatusFilter";

export type FilterConfig = {
  Edit: ReactNode;
};

export type FilterValues = {
  Department?: number[];
  Building?: number[];
  Room?: number[];
  "Asset Class"?: number[];
  Permission?: number[];
  Status?: string[];
  Date?: string[];
  Auditor?: number[];
  "Entity Type"?: string[];
  "Performed By"?: number[];
};

export const filterConfiguration: Partial<Record<keyof FilterValues, FilterConfig>> = {
  Department: {
    Edit: <DepartmentFilter />
  }, 
  "Asset Class": {
    Edit: <AssetClassFilter />
  },
  Permission: {
    Edit: <PermissionsFilter />
  },
  Building: {
    Edit: <BuildingFilter />
  },
  Room: {
    Edit: <RoomFilter />
  },
  Status: {
    Edit: <StatusFilter />
  },
  Date: {
    Edit: <DateFilter />
  },
  Auditor: {
    Edit: <AuditorFilter />
  },
  "Entity Type": {
    Edit: <EntityTypeFilter />
  },
  "Performed By": {
    Edit: <PerformedByFilter />
  }
};
