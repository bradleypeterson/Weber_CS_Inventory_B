import type { Request, Response } from "express";
import { hasPermission, PermissionId } from "../../../@types/permissions";
import { validateUser } from "../auth/validateToken";
import { reviewApprovalRequest } from "../db/procedures/approvalRequests";

type ReviewBody = {
  decision: "approved" | "denied";
  note: string;
};


function isReviewBody(value: unknown): value is ReviewBody {
  if (typeof value !== "object" || value === null) return false;

  const body = value as Record<string, unknown>;
  return (
    (body.decision === "approved" || body.decision === "denied") &&
    typeof body.note === "string" &&
    body.note.trim().length <= 1000
  );
}

export async function reviewAssetRequest(_req: Request, res: Response) {
  const user: unknown = res.locals.user;

  if (!validateUser(user)) {
    res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    return;
  }

  if (!hasPermission(user.Permissions, PermissionId.APPROVE_ASSET_REQUESTS)) {
    res.status(403).json({ status: "error", error: { message: "Approval permission is required" } });
    return;
  }

  const requestId = Number(_req.params.id);
  if (!Number.isSafeInteger(requestId) || requestId < 1 || !isReviewBody(_req.body)) {
    res.status(400).json({ status: "error", error: { message: "Invalid review request" } });
    return;
  }

  try {
    const result = await reviewApprovalRequest({
      requestId,
      decision: _req.body.decision,
      note: _req.body.note.trim(),
      reviewedBy: user.UserID
    });

    if (result.status === "not_found") {
      res.status(404).json({ status: "error", error: { message: "Approval request not found" } });
      return;
    }

    if (result.status === "already_reviewed") {
      res.status(409).json({ status: "error", error: { message: "Approval request was already reviewed" } });
      return;
    }

    res.json({ status: "success", data: { assetId: result.assetId } });
  } catch (error) {
    console.error("Error approving pending asset request:", error);
    res.status(500).json({ status: "error", error: { message: "Could not review asset request" } });
  }
}