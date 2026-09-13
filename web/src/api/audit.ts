import { JSONSchemaType } from "ajv";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";

// Define the ItemNote type for audit notes
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

export type RawData = {
  tag_number: string | number | null;
  department?: string | null;
  asset_class?: string | null;
  device_type?: string | null;
  contact_person?: string | null;
  status?: string | null;
  audit_time?: string | null;
  building?: string | null;
  room?: string | null;
  created_by?: string | null;
};

const auditDetailsSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      tag_number: { type: ["string", "number", "null"] },
      department: { type: ["string", "null"] },
      asset_class: { type: ["string", "null"] },
      device_type: { type: ["string", "null"] },
      contact_person: { type: ["string", "null"] },
      status: { type: ["string", "null"] },
      audit_time: { type: ["string", "null"] },
      building: { type: ["string", "null"] },
      room: { type: ["string", "null"] },
      created_by: { type: ["string", "null"] }
    },
    required: ["tag_number"],
    additionalProperties: true
  }
} as const;

const validateAuditDetails = ajv.compile<RawData[]>(auditDetailsSchema);

// Simple validator for audit notes
const auditNotesSchema: JSONSchemaType<ItemNote[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      tagNumber: { type: "string" },
      note: { type: "string" }
    },
    required: ["tagNumber", "note"]
  }
};

const validateAuditNotes = ajv.compile<ItemNote[]>(auditNotesSchema);


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

export async function fetchAuditDetails(auditId: string) {
  const response = await get(`/audits/history/${auditId}`, validateAuditDetails);
  if (response.status === "success") {
    return response.data;
  }

  throw new Error(response.error.message);
}

export async function fetchAuditNotes(auditId: string) {
  const response = await get(`/audits/notes/${auditId}`, validateAuditNotes);
  if (response.status === "success") {
    return response.data;
  }

  throw new Error(response.error.message);
}

export async function updateAuditNotes(auditId: string, notes: ItemNote[]) {
  const response = await post(
    `/audits/update-notes/${auditId}`,
    { notes },
    validateEmptyResponse
  );
  if (response.status === "success") {
    return true;
  }

  throw new Error(response.error.message);
}