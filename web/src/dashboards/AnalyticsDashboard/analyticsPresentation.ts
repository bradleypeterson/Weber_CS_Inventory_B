import type { AssetAnalytics } from "../../../../@types/analytics";

export function assetPercentage(count: number, total: number): string {
  return total > 0 ? (count / total * 100).toFixed(1) : "0.0";
}

export function analyticsSummary(data: AssetAnalytics) {
  return [
    { name: "Total active assets", count: data.totalActiveAssets, hint: "Assets you can access" },
    { name: "Departments with assets", count: data.byDepartment.filter(group => group.id !== null).length, hint: "Excludes unassigned departments" },
    { name: "Device types with assets", count: data.byDeviceType.filter(group => group.id !== null).length, hint: "Excludes unassigned device types" }
  ];
}
