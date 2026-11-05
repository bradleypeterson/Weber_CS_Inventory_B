import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { listPendingAssetRequests } from "./list";
import { reviewAssetRequest } from "./review";

export const approvalRequestRouter = Router();

approvalRequestRouter.get("/pending", requirePermission(PermissionId.APPROVE_ASSET_REQUESTS), listPendingAssetRequests);

approvalRequestRouter.post("/:id/review", requirePermission(PermissionId.APPROVE_ASSET_REQUESTS), reviewAssetRequest);