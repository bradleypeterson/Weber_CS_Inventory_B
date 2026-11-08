export type AssetCountGroup = {
  id: number | null;
  name: string;
  count: number;
};

export type AssetAnalyticsFilters = {
  departmentId?: number | null;
  deviceTypeId?: number | null;
};

export type AssetAnalytics = {
  totalActiveAssets: number;
  byDepartment: AssetCountGroup[];
  byDeviceType: AssetCountGroup[];
  byCondition: AssetCountGroup[];
};
