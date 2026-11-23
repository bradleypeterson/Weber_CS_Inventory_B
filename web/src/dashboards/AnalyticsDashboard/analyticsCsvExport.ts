import type { AssetAnalytics } from "../../../../@types/analytics";
import { downloadExport } from "../../export/downloadExport";
import { analyticsSummary, assetPercentage } from "./analyticsPresentation";

export function downloadAnalyticsCsv(data: AssetAnalytics): Promise<void> {
  const total = data.totalActiveAssets;
  const breakdowns = [
    { category: "Department", groups: data.byDepartment },
    { category: "Device Type", groups: data.byDeviceType },
    { category: "Condition", groups: data.byCondition }
  ];

  return downloadExport({
    format: "csv",
    filenameBase: "analytics",
    data: [
      ...analyticsSummary(data).map(({ name, count }) => ({ category: "Summary", name, count, percentage: "" })),
      ...breakdowns.flatMap(({ category, groups }) => groups.map(({ name, count }) => ({
        category, name, count, percentage: `${assetPercentage(count, total)}%`
      })))
    ],
    columns: [
      { label: "Category", getValue: row => row.category },
      {
        label: "Name",
        // Treat user-defined names as text when Excel opens the CSV.
        getValue: row => /^(?:\s*[=+@-]|[\t\r\n])/.test(row.name) ? `'${row.name}` : row.name
      },
      { label: "Count", getValue: row => String(row.count) },
      { label: "Percentage", getValue: row => row.percentage }
    ]
  });
}
