import { Router } from "express";
import { listPendingAssetRequests } from "./list";

export const approvalRequestRouter = Router();

approvalRequestRouter.get("/pending", listPendingAssetRequests);