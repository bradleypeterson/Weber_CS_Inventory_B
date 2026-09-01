import type { RowDataPacket } from "mysql2";
import { pool } from "..";
import type { Permission } from "../../../../@types/data";

interface PermissionRow extends RowDataPacket, Permission {}

export async function getAllPermissions() {
  try {
    const query = `select PermissionID, Name from Permission`;
    const [rows] = await pool.query<PermissionRow[]>(query);
    return rows;
  } catch (error) {
    console.error(`Error in getAllPermissions`, error);
    throw new Error("An error occurred while getting permissions from database");
  }
}
