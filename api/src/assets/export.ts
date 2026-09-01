import type { Request, Response } from "express";
import { canAccessAssetDepartment, getAssetAccessScope } from "../auth/assetScope";
import { getAssetDetailsByIds } from "../db/procedures/assets";

export async function exportAssetsByIds(req: Request, res: Response) {
  try {
    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const { equipmentIds } = req.body as { equipmentIds?: unknown };
    if (!Array.isArray(equipmentIds)) {
      res.status(400).json({
        status: "error",
        error: { message: "equipmentIds must be an array" }
      });
      return;
    }
    const ids = equipmentIds.filter((id): id is number => typeof id === "number" && Number.isInteger(id));
    const rows = await getAssetDetailsByIds(ids);

    if (rows.length !== ids.length) {
      res.status(404).json({
        status: "error",
        error: { message: "One or more assets do not exist" }
      });
      return;
    }

    const unauthorizedAsset = rows.find((row) => !canAccessAssetDepartment(scope, row.DepartmentID));
    if (unauthorizedAsset !== undefined) {
      res.status(403).json({
        status: "error",
        error: { message: "One or more assets are outside your department scope" }
      });
      return;
    }

    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error("Error in exportAssetsByIds:", error);
    res.status(500).json({
      status: "error",
      error: { message: "Could not export assets" }
    });
  }
}
