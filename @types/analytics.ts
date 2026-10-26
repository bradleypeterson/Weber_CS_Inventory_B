export type AssetCountGroup = {
  id: number | null;
  name: string;
  count: number;
};

export type AssetAnalytics = {
  totalActiveAssets: number;
  byDepartment: AssetCountGroup[];
  byDeviceType: AssetCountGroup[];
};
