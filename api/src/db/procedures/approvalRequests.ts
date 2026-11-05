import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";
import { EQUIPMENT_ENTITY_TYPE, formatEquipmentCreatedNote } from "../../assets/equipmentSystemNotes";
import { addAsset, type AddAssetParams } from "./assets";
import { addSystemNote } from "./systemNotes";

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
  AssetDetails: AssetDetails;
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

type AssetDetails = Record<string, string | number | boolean | null>;

interface PendingAssetRequestRow extends RowDataPacket {
  RequestID: number;
  TagNumber: string;
  Description: string | null;
  RequestedBy: string;
  RequestedAt: string;
  AssetDetailsJson: string;
  LocationDisplay: string | null;
  DepartmentDisplay: string | null;
  AssetClassDisplay: string | null;
  ConditionDisplay: string | null;
  DeviceTypeDisplay: string | null;
  ContactPersonDisplay: string | null;
}

function parseAssetDetails(value: string): AssetDetails {
  const parsed: unknown = JSON.parse(value);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid asset details in approval request");
  }

  for (const fieldValue of Object.values(parsed)) {
    if (
      fieldValue !== null &&
      typeof fieldValue !== "string" &&
      typeof fieldValue !== "number" &&
      typeof fieldValue !== "boolean"
    ) {
      throw new Error("Invalid asset detail value in approval request");
    }
  }

  return parsed as AssetDetails;
}

export async function getPendingAssetRequests(): Promise<PendingAssetRequest[]> {
  try {
    const [rows] = await pool.query<PendingAssetRequestRow[]>(`
      SELECT
        request.RequestID,
        JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.TagNumber')) AS TagNumber,
        JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.Description')) AS Description,
        CONCAT(person.FirstName, ' ', person.LastName) AS RequestedBy,
        DATE_FORMAT(request.RequestedAt, '%Y-%m-%d %H:%i:%s') AS RequestedAt,
        CAST(request.Payload AS CHAR) AS AssetDetailsJson,
        CASE
          WHEN location.LocationID IS NULL THEN NULL
          ELSE CONCAT(
            building.Name,
            ' - Room ',
            location.RoomNumber,
            ' (',
            location.Barcode,
            ')'
          )
        END AS LocationDisplay,
        department.Name AS DepartmentDisplay,
        assetClass.Name AS AssetClassDisplay,
        conditionRow.ConditionName AS ConditionDisplay,
        deviceType.Name AS DeviceTypeDisplay,
        CASE
          WHEN contact.PersonID IS NULL THEN NULL
          ELSE CONCAT(contact.FirstName, ' ', contact.LastName)
        END AS ContactPersonDisplay
      FROM ApprovalRequest request
      JOIN \`User\` user ON user.UserID = request.RequestedBy
      JOIN Person person ON person.PersonID = user.PersonID
      LEFT JOIN Location location
        ON location.LocationID = JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.LocationID'))
      LEFT JOIN Building building ON building.BuildingID = location.BuildingID
      LEFT JOIN Department department
        ON department.DepartmentID = JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.DepartmentID'))
      LEFT JOIN AssetClass assetClass
        ON assetClass.AssetClassID = JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.AssetClassID'))
      LEFT JOIN \`Condition\` conditionRow
        ON conditionRow.ConditionID = JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.ConditionID'))
      LEFT JOIN DeviceType deviceType
        ON deviceType.DeviceTypeID = JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.DeviceTypeID'))
      LEFT JOIN Person contact
        ON contact.PersonID = JSON_UNQUOTE(JSON_EXTRACT(request.Payload, '$.ContactPersonID'))
      WHERE request.Status = 'pending'
        AND request.RequestType = 'asset_add'
      ORDER BY request.RequestedAt ASC, request.RequestID ASC
    `);

    return rows.map(({
      AssetDetailsJson,
      LocationDisplay,
      DepartmentDisplay,
      AssetClassDisplay,
      ConditionDisplay,
      DeviceTypeDisplay,
      ContactPersonDisplay,
      ...request
    }) => {
      const {
        LocationID,
        DepartmentID,
        AssetClassID,
        ConditionID,
        DeviceTypeID,
        ContactPersonID,
        ...otherAssetDetails
      } = parseAssetDetails(AssetDetailsJson);

      return {
        ...request,
        AssetDetails: {
          ...otherAssetDetails,
          Location: LocationDisplay ?? (LocationID == null ? "Not specified" : `Location ID ${LocationID}`),
          Department: DepartmentDisplay ?? (DepartmentID == null ? "Not specified" : `Department ID ${DepartmentID}`),
          AssetClass: AssetClassDisplay ?? (AssetClassID == null ? "Not specified" : `Asset class ID ${AssetClassID}`),
          Condition: ConditionDisplay ?? (ConditionID == null ? "Not specified" : `Condition ID ${ConditionID}`),
          DeviceType: DeviceTypeDisplay ?? (DeviceTypeID == null ? "Not specified" : `Device type ID ${DeviceTypeID}`),
          ContactPerson:
            ContactPersonDisplay ?? (ContactPersonID == null ? "Not specified" : `Contact person ID ${ContactPersonID}`)
        }
      };
    });
  } catch (error) {
    console.error("Error in getPendingAssetRequests:", error);
    throw new Error("An error occurred while getting pending asset requests");
  }
}

type ReviewDecision = "approved" | "denied";

type ReviewApprovalRequestResult =
  | { status: "not_found" }
  | { status: "already_reviewed" }
  | { status: "success"; assetId: number | null };

type ReviewApprovalRequestParams = {
  requestId: number;
  decision: ReviewDecision;
  note: string;
  reviewedBy: number;
};

type ApprovalRequestRow = RowDataPacket & {
  RequestID: number;
  RequestType: string;
  Payload: unknown;
  Status: string;
  RequestedBy: number;
  RequesterName: string;
};

const requiredAssetNumberFields = [
  "LocationID",
  "DepartmentID",
  "AssetClassID",
  "ConditionID",
  "DeviceTypeID"
] as const;

const optionalAssetStringFields = new Set([
  "SerialNumber",
  "Description",
  "Manufacturer",
  "PartNumber",
  "PONumber",
  "SecondaryNumber",
  "AccountingDate",
  "Model",
  "Make",
  "AssetType",
  "AssetCreationDate",
  "LastValidationDate",
  "AcqDate",
  "AcqMethod",
  "DeptNum"
]);

const optionalAssetNumberFields = new Set([
  "ContactPersonID",
  "FiscalYearID",
  "AccountCost",
  "AcqCost",
  "TotalCost",
  "EstReplacementCost"
]);

const optionalAssetBooleanFields = new Set([
  "Rapid7",
  "CrowdStrike",
  "ArchiveStatus"
]);

function isAddAssetParams(value: unknown): value is AddAssetParams {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const payload = value as Record<string, unknown>;
  if (typeof payload.TagNumber !== "string" || payload.TagNumber.length > 16) return false;

  for (const field of requiredAssetNumberFields) {
    if (typeof payload[field] !== "number" || !Number.isInteger(payload[field])) return false;
  }

  for (const [field, fieldValue] of Object.entries(payload)) {
    if (field === "TagNumber") continue;

    if (requiredAssetNumberFields.includes(field as typeof requiredAssetNumberFields[number])) {
      continue;
    }

    if (optionalAssetStringFields.has(field)) {
      if (fieldValue !== null && typeof fieldValue !== "string") return false;
      continue;
    }

    if (optionalAssetNumberFields.has(field)) {
      if (fieldValue !== null &&
        (typeof fieldValue !== "number" || !Number.isFinite(fieldValue))) return false;
      continue;
    }

    if (optionalAssetBooleanFields.has(field)) {
      if (fieldValue !== null && typeof fieldValue !== "boolean") return false;
      continue;
    }

    return false;
  }

  return true;
}

function parseAssetPayload(payload: unknown): AddAssetParams {
  let value = payload;

  if (typeof value === "string") {
    value = JSON.parse(value) as unknown;
  }

  if (!isAddAssetParams(value)) {
    throw new Error("Approval request contains an invalid asset payload");
  }

  return value;
}

export async function reviewApprovalRequest({
  requestId,
  decision,
  note,
  reviewedBy
}: ReviewApprovalRequestParams): Promise<ReviewApprovalRequestResult> {

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = await connection.query<ApprovalRequestRow[]>(
      `SELECT
        ar.RequestID,
        ar.RequestType,
        ar.Payload,
        ar.Status,
        ar.RequestedBy,
        CONCAT(p.FirstName, ' ', p.LastName) AS RequesterName
      FROM ApprovalRequest ar
      JOIN \`User\` u ON u.UserID = ar.RequestedBy
      JOIN Person p ON p.PersonID = u.PersonID
      WHERE ar.RequestID = ?
      FOR UPDATE`,
      [requestId]
    );

    const request = rows[0];

    if (!request) {
      await connection.rollback();
      return { status: "not_found" };
    }

    if (request.Status !== "pending") {
      await connection.rollback();
      return { status: "already_reviewed" };
    }

    if (request.RequestType !== "asset_add") {
      throw new Error(`Unsupported approval request type: ${request.RequestType}`);
    }

    let assetId: number | null = null;

    if (decision === "approved") {
      const assetParams = parseAssetPayload(request.Payload);
      const asset = await addAsset(assetParams, connection);
      assetId = asset.insertId;

      await addSystemNote(
        EQUIPMENT_ENTITY_TYPE,
        assetId,
        formatEquipmentCreatedNote(assetId, assetParams),
        reviewedBy,
        "Created",
        connection
      );
    }


    const status = decision === "approved" ? "approved" : "denied";
    const [updateResult] = await connection.query<ResultSetHeader>(
      `UPDATE ApprovalRequest
       SET Status = ?,
           ReviewedBy = ?,
           ReviewedAt = NOW(),
           ReviewNote = ?,
           ResultEntityType = ?,
           ResultEntityID = ?
       WHERE RequestID = ? AND Status = 'pending'`,
      [
        status,
        reviewedBy,
        note,
        decision === "approved" ? EQUIPMENT_ENTITY_TYPE : null,
        assetId,
        request.RequestID
      ]
    );

    if (updateResult.affectedRows !== 1) {
      throw new Error("Approval request changed while being reviewed");
    }

    await addSystemNote(
      "ApprovalRequest",
      request.RequestID,
      `Requested by ${request.RequesterName} (User ID ${request.RequestedBy}). ` +
        `${decision === "approved" ? "Approved" : "Denied"} by User ID ${reviewedBy}. ` +
        `Note: ${note}`,
      reviewedBy,
      decision === "approved" ? "Approved" : "Denied",
      connection
    );

    await connection.commit();
    transactionStarted = false;

    return { status: "success", assetId };
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}