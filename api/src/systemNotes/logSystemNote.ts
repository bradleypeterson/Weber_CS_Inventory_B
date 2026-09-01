import type { Pool, PoolConnection } from "mysql2/promise";
import { pool } from "../db";
import { addSystemNote } from "../db/procedures/systemNotes";

export type SystemNoteAction = "Created" | "Updated" | "Deleted";

type Db = Pool | PoolConnection;

export type LogSystemNoteParams = {
  entityType: string;
  entityID: number;
  note: string;
  performedBy: number;
  action: SystemNoteAction;
  /** Use the same connection as the surrounding transaction when provided */
  db?: Db;
};

export async function logSystemNote(params: LogSystemNoteParams): Promise<number> {
  const { entityType, entityID, note, performedBy, action, db } = params;
  return addSystemNote(entityType, entityID, note, performedBy, action, db ?? pool);
}
