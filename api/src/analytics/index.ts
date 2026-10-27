import { Router, type Request, type Response } from "express";
import { canViewAnalytics } from "../../../@types/permissions";
import { validateUser } from "../auth/validateToken";
import { getAssetAccessScope } from "../auth/assetScope";
import { getAssetAnalytics } from "../db/procedures/analytics";

export const analyticsRouter = Router();

export async function getAssetAnalyticsHandler(_req: Request, res: Response) {
  try {
    const user = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }
    if (!canViewAnalytics(user.Permissions)) {
      res.status(403).json({ status: "error", error: { message: "You do not have permission to view analytics" } });
      return;
    }
    const scope = await getAssetAccessScope(user);
    if (!scope) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }
    const data = await getAssetAnalytics(scope.isAdmin ? undefined : scope.departmentIds);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("Error in asset analytics endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not load asset analytics" } });
  }
}

analyticsRouter.get("/assets", getAssetAnalyticsHandler);
