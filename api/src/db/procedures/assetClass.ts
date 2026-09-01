import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";
import type { AssetClass } from "../../../../@types/data";
import { ASSET_CLASS_ENTITY_TYPE, formatAssetClassDeletedNote } from "../../assetClass/assetClassSystemNotes";
import { addSystemNote } from "./systemNotes";

interface AssetClassRow extends RowDataPacket, AssetClass {}

export async function getAllAssetClasses() {
  try {
    const query = `SELECT AssetClassID, Name, Abbreviation, Deleted FROM AssetClass`;
    const [rows] = await pool.query<AssetClassRow[]>(query);
    return rows;
  } catch (error) {
    console.error(`Error in getAllAssetClasses`, error);
    throw new Error("An error occurred while getting asset classes from database");
  }
}

export async function getAssetClassById(id: number): Promise<AssetClassRow | undefined> {
  try {
    const query = `
      SELECT AssetClassID, Name, Abbreviation
      FROM AssetClass
      WHERE AssetClassID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
    `;
    const [rows] = await pool.query<AssetClassRow[]>(query, [id]);
    return rows[0];
  } catch (error) {
    console.error(`Error in getAssetClassById`, error);
    throw new Error("Failed to fetch asset class");
  }
}

export async function addAssetClass(assetClass: Omit<AssetClass, "AssetClassID">) {
  try {
    const query = `INSERT INTO AssetClass (Name, Abbreviation) VALUES (?, ?)`;
    const [result] = await pool.query<ResultSetHeader>(query, [
      assetClass.Name,
      assetClass.Abbreviation,
    ]);
    return result.insertId;
  } catch (error) {
    console.error(`Error in addAssetClass`, error);
    throw new Error("Failed to add asset class");
  }
}

export async function updateAssetClass(assetClass: AssetClass) {
  try {
    const query = `UPDATE AssetClass SET Name = ?, Abbreviation = ? WHERE AssetClassID = ?`;
    await pool.query(query, [assetClass.Name, assetClass.Abbreviation, assetClass.AssetClassID]);
  } catch (error) {
    console.error(`Error in updateAssetClass`, error);
    throw new Error("Failed to update asset class");
  }
}

export async function restoreAssetClass(id: number, performedByUserId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [snapshotRows] = await connection.query<AssetClassRow[]>(
      `SELECT AssetClassID, Name, Abbreviation FROM AssetClass WHERE AssetClassID = ? AND Deleted = 1`,
      [id]
    );
    const snapshot = snapshotRows[0];
    if (!snapshot) {
      await connection.rollback();
      throw new Error("AssetClass not found or not deleted");
    }
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE AssetClass SET Deleted = 0 WHERE AssetClassID = ? AND Deleted = 1`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("AssetClass not found or not deleted");
    }
    const note = `Asset class ID ${snapshot.AssetClassID} was restored; Name "${snapshot.Name}"; Abbreviation "${snapshot.Abbreviation}".`;
    await addSystemNote(ASSET_CLASS_ENTITY_TYPE, id, note, performedByUserId, "Restored", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in restoreAssetClass`, error);
    throw new Error("Failed to restore assetclass");
  } finally {
    connection.release();
  }
}

export async function deleteAssetClass(id: number, performedByUserId: number, snapshot: AssetClass) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE AssetClass SET Deleted = 1 WHERE AssetClassID = ? AND (Deleted = 0 OR Deleted IS NULL)`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Asset class not found or already deleted");
    }
    const note = formatAssetClassDeletedNote(snapshot.AssetClassID, snapshot.Name, snapshot.Abbreviation);
    await addSystemNote(ASSET_CLASS_ENTITY_TYPE, id, note, performedByUserId, "Deleted", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in deleteAssetClass`, error);
    throw new Error("Failed to delete asset class");
  } finally {
    connection.release();
  }
}
