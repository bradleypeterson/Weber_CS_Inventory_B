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

export async function submitAudit(data: AuditSubmission) {
  const response = await post("/audits/submit", data, validateEmptyResponse);
  if (response.status === "success") {
    return true;
  }

  throw new Error(response.error.message);
}