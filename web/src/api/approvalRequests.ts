import { ajv } from "../ajv";
import { get, post } from "./helpers";

export type PendingAssetRequest = {
  RequestID: number;
  TagNumber: string;
  Description: string | null;
  RequestedBy: string;
  RequestedAt: string;
  AssetDetails: Record<string, string | number | boolean | null>;
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
      RequestedAt: { type: "string" },
      AssetDetails: {
        type: "object",
        additionalProperties: {
          type: ["string", "number", "boolean", "null"]
        }
      }
    },
    required: ["RequestID", "TagNumber", "Description", "RequestedBy", "RequestedAt", "AssetDetails"],
    additionalProperties: false
  }
} as const;

const validatePendingAssetRequests = ajv.compile<PendingAssetRequest[]>(pendingAssetRequestsSchema);

export async function fetchPendingAssetRequests(): Promise<PendingAssetRequest[]> {
  const response = await get("/approval-requests/pending", validatePendingAssetRequests);

  if (response.status === "success") return response.data;
  throw new Error(response.error.message);
}

export type ReviewDecision = "approved" | "denied";
type ReviewAssetRequestResponse = { assetId: number | null };

const validateReviewAssetRequestResponse = ajv.compile<ReviewAssetRequestResponse>({
  type: "object",
  properties: {
    assetId: { type: ["number", "null"] }
  },
  required: ["assetId"],
  additionalProperties: false
});

export async function reviewAssetRequest(
  requestId: number,
  decision: ReviewDecision,
  note: string
): Promise<ReviewAssetRequestResponse> {
  const response = await post<ReviewAssetRequestResponse>(
    `/approval-requests/${requestId}/review`,
    { decision, note },
    validateReviewAssetRequestResponse
  );

  if (response.status === "success") return response.data;
  throw new Error(response.error.message);
}