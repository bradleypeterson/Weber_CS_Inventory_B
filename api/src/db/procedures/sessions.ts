import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { sessionConfig } from "../../../../shared/sessionConfig";
import { pool } from "..";

export async function createSession(userID: number): Promise<string> {
  const sessionID = randomUUID();
  await pool.execute("INSERT INTO UserSession (SessionID, UserID) VALUES (?, ?)", [sessionID, userID]);
  return sessionID;
}

export async function isSessionActive(sessionID: string, userID: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT SessionID FROM UserSession
     WHERE SessionID = ? AND UserID = ?
       AND LastActivityAt > TIMESTAMPADD(MICROSECOND, ?, CURRENT_TIMESTAMP(3))`,
    [sessionID, userID, -sessionConfig.logoutAfterMs * 1000]
  );
  return rows.length > 0;
}

// Check expiry again in the UPDATE so a session cannot be revived after expiry.
// Only this explicit activity endpoint updates the inactivity deadline.
export async function touchSession(sessionID: string, userID: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE UserSession SET LastActivityAt = CURRENT_TIMESTAMP(3)
     WHERE SessionID = ? AND UserID = ?
       AND LastActivityAt > TIMESTAMPADD(MICROSECOND, ?, CURRENT_TIMESTAMP(3))`,
    [sessionID, userID, -sessionConfig.logoutAfterMs * 1000]
  );
  return result.affectedRows > 0;
}

export async function deleteSession(sessionID: string, userID: number): Promise<void> {
  await pool.execute("DELETE FROM UserSession WHERE SessionID = ? AND UserID = ?", [sessionID, userID]);
}
