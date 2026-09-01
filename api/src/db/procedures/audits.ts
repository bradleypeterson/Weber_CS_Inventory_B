import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";

interface RoomRow extends RowDataPacket {
  LocationID: number;
  BuildingID: number;
  RoomNumber: string;
  Barcode: string;
}

interface AuditResult extends ResultSetHeader {
  insertId: number;
}

export async function validateRoomBarcode(barcode: string): Promise<RoomRow | null> {
  try {
    console.log('Validating barcode:', barcode);
    const query = `
      SELECT LocationID, BuildingID, RoomNumber, Barcode 
      FROM Location 
      WHERE Barcode = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<RoomRow[]>(query, [barcode]);
    console.log('Query result:', rows);
    return rows[0] || null;
  } catch (error) {
    console.error(`Error in validateRoomBarcode:`, error);
    throw new Error("Failed to validate room barcode");
  }
}

interface EquipmentDetailsRow extends RowDataPacket {
  EquipmentID: number;
  TagNumber: string;
  SerialNumber: string;
  Description: string;
  DepartmentID: number;
  DepartmentName: string;
  LocationID: number;
  RoomNumber: string;
  BuildingID: number;
  BuildingName: string;
  BuildingAbbr: string;
  DeviceTypeName: string;
}

export async function getEquipmentByLocation(locationId: number): Promise<EquipmentDetailsRow[]> {
  try {
    const query = `
      SELECT 
        e.EquipmentID,
        e.TagNumber,
        e.SerialNumber,
        e.Description,
        d.DepartmentID,
        d.Name as DepartmentName,
        l.LocationID,
        l.RoomNumber,
        b.BuildingID,
        b.Name as BuildingName,
        b.Abbreviation as BuildingAbbr,
        dt.Name as DeviceTypeName
      FROM Equipment e
      LEFT JOIN Department d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN Location l ON e.LocationID = l.LocationID
      LEFT JOIN Building b on l.BuildingID = b.BuildingID 
      LEFT JOIN DeviceType dt ON e.DeviceTypeID = dt.DeviceTypeID
      WHERE e.LocationID = ? AND e.ArchiveStatus = 0
    `;
    const [rows] = await pool.query<EquipmentDetailsRow[]>(query, [locationId]);
    return rows;
  } catch (error) {
    console.error(`Error in getEquipmentByLocation:`, error);
    throw new Error("Failed to get equipment for location");
  }
}

export async function createNote(createdBy: number, equipmentId: number, note: string): Promise<ResultSetHeader> {
  try {
    const query = `
      INSERT INTO Note (
        CreatedBy,
        EquipmentID,
        Note,
        CreatedAt
      ) VALUES (
        ?,
        ?,
        ?,
        NOW()
      )
    `;
    const [result] = await pool.query<ResultSetHeader>(query, [createdBy, equipmentId, note]);
    return result;
  } catch (error) {
    console.error(`Error in createNote:`, error);
    throw new Error("Failed to create note");
  }
}

export async function createNewAudit(
  createdBy: number, 
  locationId: number,
  equipmentItems: Array<{
    equipmentId: number;
    statusId: number;
    note: string;
  }>,
  auditTime: Date = new Date()
): Promise<ResultSetHeader> {
  try {
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create a single audit session for all items
      const [auditResult] = await connection.execute<AuditResult>(
        `INSERT INTO Audit (
          CreatedBy,
          LocationID,
          AuditTime
        ) VALUES (
          ?,
          ?,
          ?
        )`,
        [createdBy, locationId, auditTime]
      );
      const auditId = auditResult.insertId;

      // Create audit details for all items
      const detailsPromises = equipmentItems.map(item => 
        connection.execute(
          `INSERT INTO AuditDetails (
            AuditID,
            EquipmentID,
            AuditStatusID,
            AuditNote
          ) VALUES (
            ?,
            ?,
            ?,
            ?
          )`,
          [auditId, item.equipmentId, item.statusId, item.note]
        )
      );

      await Promise.all(detailsPromises);
      await connection.commit();
      return auditResult;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`Error in createNewAudit:`, error);
    throw new Error("Failed to create new audit");
  }
}

export async function getEquipmentByTagNumber(tagNumber: string) {
  const sql = `
    SELECT
      e.EquipmentID,
      e.TagNumber,
      e.SerialNumber,
      e.Description,
      d.DepartmentID,
      d.Name as DepartmentName,
      l.LocationID,
      l.RoomNumber,
      b.BuildingID,
      b.Name as BuildingName,
      b.Abbreviation as BuildingAbbr,
      dt.Name as DeviceTypeName
    FROM Equipment e
    LEFT JOIN Department d ON e.DepartmentID = d.DepartmentID
    LEFT JOIN Location l ON e.LocationID = l.LocationID
    LEFT JOIN Building b ON l.BuildingID = b.BuildingID
    LEFT JOIN DeviceType dt ON e.DeviceTypeID = dt.DeviceTypeID
    WHERE e.TagNumber = ? AND e.ArchiveStatus = 0
    LIMIT 1
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [tagNumber]);
  return rows[0];
} 