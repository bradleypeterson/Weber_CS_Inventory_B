import type { Request, Response } from "express";
import { getAssetAccessScope } from "../auth/assetScope";
import { getAllAssets, getAllAssetsOverview } from "../db/procedures/assets";

export async function listAssets(req: Request, res: Response) {
  try {
    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const rows = await getAllAssets(scope.isAdmin ? undefined : scope.departmentIds);
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listAssets endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all assets" } });
  }
}

export async function listAssetOverviews(req: Request, res: Response) {
  try {
    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const rows = await getAllAssetsOverview(scope.isAdmin ? undefined : scope.departmentIds);
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listAssetOverviews endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all assets" } });
  }
}
