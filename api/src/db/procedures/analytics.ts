import type { RowDataPacket } from "mysql2";
import type { AssetAnalytics, AssetCountGroup } from "../../../../@types/analytics";
import { pool } from "..";

interface CountRow extends RowDataPacket {
  DepartmentID: number | null;
  DepartmentName: string | null;
  DeviceTypeID: number | null;
  DeviceTypeName: string | null;
  AssetCount: number | string;
}

// One grouped query gives both breakdowns and the total a consistent snapshot.
export async function getAssetAnalytics(departmentIds?: number[]): Promise<AssetAnalytics> {
  if (departmentIds?.length === 0) {
    return { totalActiveAssets: 0, byDepartment: [], byDeviceType: [] };
  }
  const scope = departmentIds === undefined
    ? ""
    : `AND e.DepartmentID IN (${departmentIds.map(() => "?").join(",")})`;
  const [rows] = await pool.query<CountRow[]>(`
    SELECT e.DepartmentID, d.Name AS DepartmentName,
      e.DeviceTypeID, dt.Name AS DeviceTypeName, COUNT(*) AS AssetCount
    FROM Equipment e
    LEFT JOIN Department d ON d.DepartmentID = e.DepartmentID
    LEFT JOIN DeviceType dt ON dt.DeviceTypeID = e.DeviceTypeID
    WHERE e.ArchiveStatus = 0 AND (e.Deleted = 0 OR e.Deleted IS NULL)
      ${scope}
    GROUP BY e.DepartmentID, d.Name, e.DeviceTypeID, dt.Name
  `, departmentIds ?? []);

  const departments = new Map<number | null, AssetCountGroup>();
  const deviceTypes = new Map<number | null, AssetCountGroup>();
  let totalActiveAssets = 0;
  for (const row of rows) {
    const count = Number(row.AssetCount);
    totalActiveAssets += count;
    for (const [groups, id, name] of [
      [departments, row.DepartmentID, row.DepartmentName],
      [deviceTypes, row.DeviceTypeID, row.DeviceTypeName]
    ] as const) {
      const existing = groups.get(id);
      if (existing) existing.count += count;
      else groups.set(id, { id, name: name ?? (id === null ? "Unassigned" : `Unknown (${id})`), count });
    }
  }
  const sorted = (groups: Map<number | null, AssetCountGroup>) =>
    [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { totalActiveAssets, byDepartment: sorted(departments), byDeviceType: sorted(deviceTypes) };
}
