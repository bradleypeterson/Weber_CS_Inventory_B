import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool, PoolConnection } from "mysql2/promise";
import { pool } from "..";

type QueryableDb = Pool | PoolConnection;

export type SystemNote = {
  SystemNoteID: number;
  EntityType: string;
  EntityID: number;
  Action: string | null;
  Note: string;
  PerformedBy: number | null;
  PerformedByName: string;
  PerformedAt: string;
};

interface SystemNoteRow extends RowDataPacket, SystemNote {}

export type SystemNoteFilters = {
  entityTypes?: string[];
  /** When set, restricts notes to this EntityID (e.g. EquipmentID for EntityType Equipment) */
  entityId?: number;
  performedBy?: number;
  startDate?: string;
  endDate?: string;
};

export type SystemNoteListResult = {
  rows: SystemNote[];
  total: number;
};

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const value = error.code;
    if (typeof value === "string") return value;
  }
  return undefined;
}

export async function addSystemNote(
  entityType: string,
  entityID: number,
  note: string,
  performedBy: number,
  action: string | null = null,
  db: QueryableDb = pool
): Promise<number> {
  const query = `
    INSERT INTO SystemNote (EntityType, EntityID, Action, Note, PerformedBy)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query<ResultSetHeader>(query, [entityType, entityID, action, note, performedBy]);
  return result.insertId;
}

export async function getSystemNotes(
  filters: SystemNoteFilters = {},
  pagination?: { page: number; pageSize: number }
): Promise<SystemNoteListResult> {
  const whereClauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.entityTypes !== undefined && filters.entityTypes.length > 0) {
    const placeholders = filters.entityTypes.map(() => "?").join(",");
    whereClauses.push(`sn.EntityType IN (${placeholders})`);
    params.push(...filters.entityTypes);
  }
  if (filters.entityId !== undefined) {
    whereClauses.push("sn.EntityID = ?");
    params.push(filters.entityId);
  }
  if (filters.performedBy !== undefined) {
    whereClauses.push("sn.PerformedBy = ?");
    params.push(filters.performedBy);
  }
  if (filters.startDate !== undefined) {
    whereClauses.push("DATE(sn.PerformedAt) >= ?");
    params.push(filters.startDate);
  }
  if (filters.endDate !== undefined) {
    whereClauses.push("DATE(sn.PerformedAt) <= ?");
    params.push(filters.endDate);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const paginationSql = pagination ? "LIMIT ? OFFSET ?" : "";
  const paginationParams = pagination ? [pagination.pageSize, (pagination.page - 1) * pagination.pageSize] : [];
  const query = `
    SELECT
      sn.SystemNoteID,
      sn.EntityType,
      sn.EntityID,
      sn.Action,
      sn.Note,
      sn.PerformedBy,
      COALESCE(NULLIF(TRIM(CONCAT(COALESCE(p.FirstName, ''), ' ', COALESCE(p.LastName, ''))), ''), 'unknown')
        AS PerformedByName,
      sn.PerformedAt
    FROM SystemNote sn
    LEFT JOIN User u ON sn.PerformedBy = u.UserID
    LEFT JOIN Person p ON u.PersonID = p.PersonID
    ${where}
    ORDER BY sn.PerformedAt DESC, sn.SystemNoteID DESC
    ${paginationSql}
  `;
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM SystemNote sn
    ${where}
  `;
  try {
    const [rows] = await pool.query<SystemNoteRow[]>(query, [...params, ...paginationParams]);
    const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(countQuery, params);
    return { rows, total: countRows[0]?.total ?? 0 };
  } catch (error: unknown) {
    const errorCode = getErrorCode(error);
    // Gracefully handle environments where the new table has not been migrated yet.
    if (errorCode === "ER_NO_SUCH_TABLE") {
      return { rows: [], total: 0 };
    }
    throw error;
  }
}

export async function getSystemNoteEntityTypes(): Promise<string[]> {
  try {
    const query = `
      SELECT DISTINCT EntityType
      FROM SystemNote
      WHERE EntityType IS NOT NULL
        AND TRIM(EntityType) <> ''
      ORDER BY EntityType ASC
    `;
    const [rows] = await pool.query<Array<RowDataPacket & { EntityType: string }>>(query);
    return rows.map((r) => r.EntityType);
  } catch (error: unknown) {
    const errorCode = getErrorCode(error);
    if (errorCode === "ER_NO_SUCH_TABLE") {
      return [];
    }
    throw error;
  }
}

