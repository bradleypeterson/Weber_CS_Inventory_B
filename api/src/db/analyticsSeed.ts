import type { Pool, PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

// Two additive cohorts: ten per department, plus ten per device type.
// Stable tags make this safe to repeat without duplicating demo assets.
export async function seedAnalyticsAssets(db: Pool | PoolConnection) {
  const [departments] = await db.query<RowDataPacket[]>(
    "SELECT DepartmentID FROM Department WHERE Deleted = 0 OR Deleted IS NULL ORDER BY DepartmentID"
  );
  const [types] = await db.query<RowDataPacket[]>(
    "SELECT DeviceTypeID FROM DeviceType WHERE Deleted = 0 OR Deleted IS NULL ORDER BY DeviceTypeID"
  );
  if (!departments.length || !types.length) throw new Error("Analytics seed requires departments and device types");
  let added = 0;
  const insert = async (tag: string, department: number, type: number) => {
    const [result] = await db.execute<import("mysql2").ResultSetHeader>(`
      INSERT INTO Equipment (TagNumber, SerialNumber, Description, DepartmentID, DeviceTypeID, ArchiveStatus, Deleted)
      SELECT ?, ?, 'Fictional analytics demo asset', ?, ?, 0, 0
      WHERE NOT EXISTS (SELECT 1 FROM Equipment WHERE TagNumber = ?)
    `, [tag, `SN-${tag}`, department, type, tag]);
    added += result.affectedRows;
  };
  for (const [index, department] of departments.entries()) {
    for (let i = 0; i < 10; i++) {
      await insert(`TEST-AN-D${department.DepartmentID}-${i + 1}`, department.DepartmentID,
        types[(index + i) % types.length].DeviceTypeID);
    }
  }
  for (const [index, type] of types.entries()) {
    for (let i = 0; i < 10; i++) {
      await insert(`TEST-AN-T${type.DeviceTypeID}-${i + 1}`,
        departments[(index + i) % departments.length].DepartmentID, type.DeviceTypeID);
    }
  }
  return added;
}
