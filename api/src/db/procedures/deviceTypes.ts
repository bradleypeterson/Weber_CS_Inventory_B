import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";
import type { DeviceType } from "../../../../@types/data";
import { DEVICE_TYPE_ENTITY_TYPE, formatDeviceTypeDeletedNote } from "../../deviceType/deviceTypeSystemNotes";
import { addSystemNote } from "./systemNotes";

interface DeviceTypeRow extends RowDataPacket, DeviceType {}

export async function getAllDeviceTypes() {
  try {
    const query = `SELECT DeviceTypeID, Name, Abbreviation, Deleted FROM DeviceType`;
    const [rows] = await pool.query<DeviceTypeRow[]>(query);
    return rows;
  } catch (error) {
    console.error(`Error in getAllDeviceTypes`, error);
    throw new Error("Failed to fetch device types");
  }
}

export async function getDeviceTypeById(id: number): Promise<DeviceTypeRow | undefined> {
  try {
    const query = `
      SELECT DeviceTypeID, Name, Abbreviation
      FROM DeviceType
      WHERE DeviceTypeID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
    `;
    const [rows] = await pool.query<DeviceTypeRow[]>(query, [id]);
    return rows[0];
  } catch (error) {
    console.error(`Error in getDeviceTypeById`, error);
    throw new Error("Failed to fetch device type");
  }
}

export async function addDeviceType(deviceType: Omit<DeviceType, "DeviceTypeID">) {
  try {
    const query = `INSERT INTO DeviceType (Name, Abbreviation) VALUES (?, ?)`;
    const [result] = await pool.query<ResultSetHeader>(query, [
      deviceType.Name,
      deviceType.Abbreviation,
    ]);
    return result.insertId;
  } catch (error) {
    console.error(`Error in addDeviceType`, error);
    throw new Error("Failed to add device type");
  }
}

export async function updateDeviceType(deviceType: DeviceType) {
  try {
    const query = `UPDATE DeviceType SET Name = ?, Abbreviation = ? WHERE DeviceTypeID = ?`;
    await pool.query(query, [deviceType.Name, deviceType.Abbreviation, deviceType.DeviceTypeID]);
  } catch (error) {
    console.error(`Error in updateDeviceType`, error);
    throw new Error("Failed to update device type");
  }
}

export async function restoreDeviceType(id: number, performedByUserId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [snapshotRows] = await connection.query<DeviceTypeRow[]>(
      `SELECT DeviceTypeID, Name, Abbreviation FROM DeviceType WHERE DeviceTypeID = ? AND Deleted = 1`,
      [id]
    );
    const snapshot = snapshotRows[0];
    if (!snapshot) {
      await connection.rollback();
      throw new Error("DeviceType not found or not deleted");
    }
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE DeviceType SET Deleted = 0 WHERE DeviceTypeID = ? AND Deleted = 1`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("DeviceType not found or not deleted");
    }
    const note = `Device type ID ${snapshot.DeviceTypeID} was restored; Name "${snapshot.Name}"; Abbreviation "${snapshot.Abbreviation}".`;
    await addSystemNote(DEVICE_TYPE_ENTITY_TYPE, id, note, performedByUserId, "Restored", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in restoreDeviceType`, error);
    throw new Error("Failed to restore devicetype");
  } finally {
    connection.release();
  }
}

export async function deleteDeviceType(id: number, performedByUserId: number, snapshot: DeviceType) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE DeviceType SET Deleted = 1 WHERE DeviceTypeID = ? AND (Deleted = 0 OR Deleted IS NULL)`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Device type not found or already deleted");
    }
    const note = formatDeviceTypeDeletedNote(snapshot.DeviceTypeID, snapshot.Name, snapshot.Abbreviation);
    await addSystemNote(DEVICE_TYPE_ENTITY_TYPE, id, note, performedByUserId, "Deleted", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in deleteDeviceType`, error);
    throw new Error("Failed to delete device type");
  } finally {
    connection.release();
  }
}