import type { RowDataPacket } from "mysql2";
import { pool } from "..";
import type { FiscalYear } from "../../../../@types/data";

interface FiscalYearRow extends RowDataPacket, FiscalYear {}
export async function getAllFiscalYears() {
  try {
    const query = `
      select ReplacementID, Year
      from ReplacementFiscalYear
    `;

    const [rows] = await pool.query<FiscalYearRow[]>(query);

    return rows;
  } catch (error) {
    console.error(`Error in getAllFiscalYears`, error);
    throw new Error("An error occurred while getting fiscal years.");
  }
}
