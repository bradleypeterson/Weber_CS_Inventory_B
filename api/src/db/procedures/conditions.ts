import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";
import type { Condition } from "../../../../@types/data";
import { CONDITION_ENTITY_TYPE, formatConditionDeletedNote } from "../../condition/conditionSystemNotes";
import { addSystemNote } from "./systemNotes";

interface ConditionRow extends RowDataPacket, Condition { }
export async function getAllConditions() {
  try {
    const query = `
      SELECT ConditionID, ConditionName, ConditionAbbreviation, Deleted
      FROM \`Condition\`
    `;

    const [rows] = await pool.query<ConditionRow[]>(query);

    return rows;
  } catch (error) {
    console.error(`Error in getAllConditions`, error);
    throw new Error("An error occurred while getting conditions.");
  }
}

export async function getConditionById(id: number): Promise<ConditionRow | undefined> {
  try {
    const query = `
      SELECT ConditionID, ConditionName, ConditionAbbreviation
      FROM \`Condition\`
      WHERE ConditionID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
    `;
    const [rows] = await pool.query<ConditionRow[]>(query, [id]);
    return rows[0];
  } catch (error) {
    console.error(`Error in getConditionById`, error);
    throw new Error("Failed to fetch condition");
  }
}

export async function addCondition(condition: Omit<Condition, "ConditionID">) {
  try {
    const query = `INSERT INTO \`Condition\` (ConditionName, ConditionAbbreviation) VALUES (?, ?)`;
    const [result] = await pool.query<ResultSetHeader>(query, [
      condition.ConditionName,
      condition.ConditionAbbreviation,
    ]);
    return result.insertId; // TypeScript now knows `insertId` exists on `OkPacket`
  } catch (error) {
    console.error(`Error in addCondition`, error);
    throw new Error("Failed to add condition");
  }
}

export async function updateCondition(condition: Condition) {
  try {
    const query = `UPDATE \`Condition\` SET ConditionName = ?, ConditionAbbreviation = ? WHERE ConditionID = ?`;
    await pool.query(query, [
      condition.ConditionName,
      condition.ConditionAbbreviation,
      condition.ConditionID
    ]);
  } catch (error) {
    console.error(`Error in updateCondition`, error);
    throw new Error("Failed to update condition");
  }
}

export async function restoreCondition(id: number, performedByUserId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [snapshotRows] = await connection.query<ConditionRow[]>(
      `SELECT ConditionID, ConditionName, ConditionAbbreviation FROM \`Condition\` WHERE ConditionID = ? AND Deleted = 1`,
      [id]
    );
    const snapshot = snapshotRows[0];
    if (!snapshot) {
      await connection.rollback();
      throw new Error("Condition not found or not deleted");
    }
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE \`Condition\` SET Deleted = 0 WHERE ConditionID = ? AND Deleted = 1`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Condition not found or not deleted");
    }
    const note = `Condition ID ${snapshot.ConditionID} was restored; ConditionName "${snapshot.ConditionName}"; ConditionAbbreviation "${snapshot.ConditionAbbreviation}".`;
    await addSystemNote(CONDITION_ENTITY_TYPE, id, note, performedByUserId, "Restored", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in restoreCondition`, error);
    throw new Error("Failed to restore condition");
  } finally {
    connection.release();
  }
}

export async function deleteCondition(id: number, performedByUserId: number, snapshot: Condition) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE \`Condition\` SET Deleted = 1 WHERE ConditionID = ? AND (Deleted = 0 OR Deleted IS NULL)`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Condition not found or already deleted");
    }
    const note = formatConditionDeletedNote(
      snapshot.ConditionID,
      snapshot.ConditionName,
      snapshot.ConditionAbbreviation
    );
    await addSystemNote(CONDITION_ENTITY_TYPE, id, note, performedByUserId, "Deleted", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in deleteCondition`, error);
    throw new Error("Failed to delete condition");
  } finally {
    connection.release();
  }
}
