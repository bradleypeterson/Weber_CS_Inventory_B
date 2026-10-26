import { Router } from "express";
import { listPendingAssetRequests } from "./list";
import { reviewAssetRequest } from "./review";

export const approvalRequestRouter = Router();

approvalRequestRouter.get("/pending", listPendingAssetRequests);
approvalRequestRouter.post("/:id/review", reviewAssetRequest);