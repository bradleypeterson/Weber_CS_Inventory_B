import { JSONSchemaType } from "ajv";
import { ajv } from "../ajv";
import { post, validateEmptyResponse } from "./helpers";

export type ItemNote = {
  tagNumber: string;
  note: string;
};

export type AuditSubmission = {
  roomId: string;
  itemStatuses: Record<string, number>;
  itemNotes: ItemNote[];
};

export type AuditInitiateResponse = {
  roomNumber: string;
  locationId: number;
  equipmentCount: number;
  isEmptyRoom: boolean;
};

const auditInitiateResponseSchema: JSONSchemaType<AuditInitiateResponse> = {
  type: "object",
  properties: {
    roomNumber: { type: "string" },
    locationId: { type: "number" },
    equipmentCount: { type: "number" },
    isEmptyRoom: { type: "boolean" }
  },
  required: [
    "roomNumber",
    "locationId",
    "equipmentCount",
    "isEmptyRoom"
  ],
  additionalProperties: false
};

const validateAuditInitiateResponse = ajv.compile<AuditInitiateResponse>(
  auditInitiateResponseSchema
);

export async function initiateAudit(roomBarcode: string) {
  const response = await post("/audits/initiate", { roomBarcode }, validateAuditInitiateResponse);
  if (response.status === "success") {
    return response.data;
  }

  throw new Error(response.error.message);
}

export async function submitAudit(data: AuditSubmission) {
  const response = await post("/audits/submit", data, validateEmptyResponse);
  if (response.status === "success") {
    return true;
  }

  throw new Error(response.error.message);
}