import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";

type createApprovalRequestParams = {
  requestType: string;
  payload: object;
  requestedBy: number;
};

export interface PendingAssetRequest extends RowDataPacket {
  RequestID: number;
  TagNumber: string;
  Description: string | null;
  RequestedBy: string;
  RequestedAt: string;
}

export async function createApprovalRequest({
  requestType,
  payload,
  requestedBy
}: createApprovalRequestParams): Promise<number> {
  try {
    const query = `
      INSERT INTO ApprovalRequest(
        RequestType,
        Payload,
        Status,
        RequestedBy,
        RequestedAt
      )
      VALUES (?, ?, 'pending', ?, NOW())
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      requestType,
      JSON.stringify(payload),
      requestedBy
    ]);

    return result.insertId;
  } catch (error) {
    console.error("Error in createApprovalRequest:", error);
    throw new Error("An error occurred while creating and approval request");
  }
}


export async function getPendingAssetRequests(): Promise<PendingAssetRequest[]> {
  try {
    const [rows] = await pool.query<PendingAssetRequest[]>(`
      SELECT
        request.RequestID,
        JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.TagNumber')) AS TagNumber,
        JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.Description')) AS Description,
        CONCAT(person.FirstName, ' ', person.LastName) AS RequestedBy,
        DATE_FORMAT(request.RequestedAt, '%Y-%m-%d %H:%i:%s') AS RequestedAt
      FROM ApprovalRequest request
      JOIN \`User\` user ON user.UserID = request.RequestedBy
      JOIN Person person ON person.PersonID = user.PersonID
      WHERE request.Status = 'pending'
        AND request.RequestType = 'asset_add'
      ORDER BY request.RequestedAt ASC, request.RequestID ASC
    `);

    return rows;
  } catch (error) {
    console.error("Error in getPendingAssetRequests:", error);
    throw new Error("An error occurred while getting pending asset requests");
  }
}