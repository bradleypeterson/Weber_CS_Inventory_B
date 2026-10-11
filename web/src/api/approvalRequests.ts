import { ajv } from "../ajv";
import { get } from "./helpers";

export type PendingAssetRequest = {
  RequestID: number;
  TagNumber: string;
  Description: string | null;
  RequestedBy: string;
  RequestedAt: string;
};

const pendingAssetRequestsSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      RequestID: { type: "number" },
      TagNumber: { type: "string" },
      Description: { type: ["string", "null"] },
      RequestedBy: { type: "string" },
      RequestedAt: { type: "string" }
    },
    required: ["RequestID", "TagNumber", "Description", "RequestedBy", "RequestedAt"],
    additionalProperties: false
  }
} as const;

const validatePendingAssetRequests = ajv.compile<PendingAssetRequest[]>(pendingAssetRequestsSchema);

export async function fetchPendingAssetRequests(): Promise<PendingAssetRequest[]> {
  const response = await get("/approval-requests/pending", validatePendingAssetRequests);

  if (response.status === "success") return response.data;
  throw new Error(response.error.message);
}