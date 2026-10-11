import type { Request, Response } from "express";
import { hasPermission, PermissionId } from "../../../@types/permissions";
import { validateUser } from "../auth/validateToken";
import { getPendingAssetRequests } from "../db/procedures/approvalRequests";

export async function listPendingAssetRequests(_req: Request, res: Response) {
  const user: unknown = res.locals.user;

  if (!validateUser(user)) {
    res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    return;
  }

  if (!hasPermission(user.Permissions, PermissionId.APPROVE_ASSET_REQUESTS)) {
    res.status(403).json({ status: "error", error: { message: "Approval permission is required" } });
    return;
  }

  try {
    const requests = await getPendingAssetRequests();
    res.json({ status: "success", data: requests });
  } catch (error) {
    console.error("Error listing pending asset requests:", error);
    res.status(500).json({ status: "error", error: { message: "Could not fetch pending asset requests" } });
  }
}