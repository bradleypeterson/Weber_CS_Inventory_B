import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";
import type { Department } from "../../../../@types/data";
import { DEPARTMENT_ENTITY_TYPE, formatDepartmentDeletedNote } from "../../department/departmentSystemNotes";
import { addSystemNote } from "./systemNotes";

interface DepartmentRow extends RowDataPacket, Department {}

export async function getAllDepartments() {
  try {
    const query = `SELECT DepartmentID, Name, Abbreviation, Deleted FROM Department`;
    const [rows] = await pool.query<DepartmentRow[]>(query);
    return rows;
  } catch (error) {
    console.error(`Error in getAllDepartments`, error);
    throw new Error("Failed to fetch departments");
  }
}

export async function getDepartmentById(id: number): Promise<DepartmentRow | undefined> {
  try {
    const query = `
      SELECT DepartmentID, Name, Abbreviation
      FROM Department
      WHERE DepartmentID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
    `;
    const [rows] = await pool.query<DepartmentRow[]>(query, [id]);
    return rows[0];
  } catch (error) {
    console.error(`Error in getDepartmentById`, error);
    throw new Error("Failed to fetch department");
  }
}

export async function addDepartment(department: Omit<Department, "DepartmentID">) {
  try {
    const query = `INSERT INTO Department (Name, Abbreviation) VALUES (?, ?)`;
    const [result] = await pool.query<ResultSetHeader>(query, [
      department.Name,
      department.Abbreviation,
    ]);
    return result.insertId;
  } catch (error) {
    console.error(`Error in addDepartment`, error);
    throw new Error("Failed to add department");
  }
}

export async function updateDepartment(department: Department) {
  try {
    const query = `UPDATE Department SET Name = ?, Abbreviation = ? WHERE DepartmentID = ?`;
    await pool.query(query, [department.Name, department.Abbreviation, department.DepartmentID]);
  } catch (error) {
    console.error(`Error in updateDepartment`, error);
    throw new Error("Failed to update department");
  }
}

export async function restoreDepartment(id: number, performedByUserId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [snapshotRows] = await connection.query<DepartmentRow[]>(
      `SELECT DepartmentID, Name, Abbreviation FROM Department WHERE DepartmentID = ? AND Deleted = 1`,
      [id]
    );
    const snapshot = snapshotRows[0];
    if (!snapshot) {
      await connection.rollback();
      throw new Error("Department not found or not deleted");
    }
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE Department SET Deleted = 0 WHERE DepartmentID = ? AND Deleted = 1`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Department not found or not deleted");
    }
    const note = `Department ID ${snapshot.DepartmentID} was restored; Name "${snapshot.Name}"; Abbreviation "${snapshot.Abbreviation}".`;
    await addSystemNote(DEPARTMENT_ENTITY_TYPE, id, note, performedByUserId, "Restored", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in restoreDepartment`, error);
    throw new Error("Failed to restore department");
  } finally {
    connection.release();
  }
}

export async function deleteDepartment(id: number, performedByUserId: number, snapshot: Department) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE Department SET Deleted = 1 WHERE DepartmentID = ? AND (Deleted = 0 OR Deleted IS NULL)`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Department not found or already deleted");
    }
    const note = formatDepartmentDeletedNote(snapshot.DepartmentID, snapshot.Name, snapshot.Abbreviation);
    await addSystemNote(DEPARTMENT_ENTITY_TYPE, id, note, performedByUserId, "Deleted", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in deleteDepartment`, error);
    throw new Error("Failed to delete department");
  } finally {
    connection.release();
  }
}
