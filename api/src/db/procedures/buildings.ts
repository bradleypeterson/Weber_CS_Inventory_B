import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";
import type { Building } from "../../../../@types/data";
import { BUILDING_ENTITY_TYPE, formatBuildingDeletedNote } from "../../building/buildingSystemNotes";
import { addSystemNote } from "./systemNotes";

interface BuildingRow extends RowDataPacket, Building {}

export async function getAllBuildings() {
  try {
    const query = `SELECT BuildingID, Name, Abbreviation, Deleted FROM Building`;
    const [rows] = await pool.query<BuildingRow[]>(query);
    return rows;
  } catch (error) {
    console.error(`Error in getAllBuildings`, error);
    throw new Error("An error occurred while getting buildings from database");
  }
}

export async function getBuildingById(id: number): Promise<BuildingRow | undefined> {
  try {
    const query = `
      SELECT BuildingID, Name, Abbreviation
      FROM Building
      WHERE BuildingID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
    `;
    const [rows] = await pool.query<BuildingRow[]>(query, [id]);
    return rows[0];
  } catch (error) {
    console.error(`Error in getBuildingById`, error);
    throw new Error("Failed to fetch building");
  }
}

export async function addBuilding(building: Omit<Building, "BuildingID">) {
  try {
    const query = `INSERT INTO Building (Name, Abbreviation) VALUES (?, ?)`;
    const [result] = await pool.query<ResultSetHeader>(query, [building.Name, building.Abbreviation]);
    return result.insertId;
  } catch (error) {
    console.error(`Error in addBuilding`, error);
    throw new Error("Failed to add building");
  }
}

export async function updateBuilding(building: Building) {
  try {
    const query = `UPDATE Building SET Name = ?, Abbreviation = ? WHERE BuildingID = ?`;
    await pool.query(query, [building.Name, building.Abbreviation, building.BuildingID]);
  } catch (error) {
    console.error(`Error in updateBuilding`, error);
    throw new Error("Failed to update building");
  }
}

export async function restoreBuilding(id: number, performedByUserId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [snapshotRows] = await connection.query<BuildingRow[]>(
      `SELECT BuildingID, Name, Abbreviation FROM Building WHERE BuildingID = ? AND Deleted = 1`,
      [id]
    );
    const snapshot = snapshotRows[0];
    if (!snapshot) {
      await connection.rollback();
      throw new Error("Building not found or not deleted");
    }
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE Building SET Deleted = 0 WHERE BuildingID = ? AND Deleted = 1`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Building not found or not deleted");
    }
    const note = `Building ID ${snapshot.BuildingID} was restored; Name "${snapshot.Name}"; Abbreviation "${snapshot.Abbreviation}".`;
    await addSystemNote(BUILDING_ENTITY_TYPE, id, note, performedByUserId, "Restored", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in restoreBuilding`, error);
    throw new Error("Failed to restore building");
  } finally {
    connection.release();
  }
}

export async function deleteBuilding(id: number, performedByUserId: number, snapshot: Building) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE Building SET Deleted = 1 WHERE BuildingID = ? AND (Deleted = 0 OR Deleted IS NULL)`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Building not found or already deleted");
    }
    const note = formatBuildingDeletedNote(snapshot.BuildingID, snapshot.Name, snapshot.Abbreviation);
    await addSystemNote(BUILDING_ENTITY_TYPE, id, note, performedByUserId, "Deleted", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in deleteBuilding`, error);
    throw new Error("Failed to delete building");
  } finally {
    connection.release();
  }
}