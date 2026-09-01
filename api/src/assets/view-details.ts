import type { Request, Response } from "express";
import { getAssetAccessScope } from "../auth/assetScope";
import { getAssetDetails, getAssetIdByTagNumber } from "../db/procedures/assets";

export async function lookupAssetByTagHandler(req: Request, res: Response) {
  const { tagNumber } = req.params;
  try {
    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const scopedAssetId = await getAssetIdByTagNumber(tagNumber, scope.isAdmin ? undefined : scope.departmentIds);
    if (scopedAssetId !== undefined) {
      res.json({ status: "success", data: { assetId: scopedAssetId } });
      return;
    }

    const existingAssetId = await getAssetIdByTagNumber(tagNumber);
    if (existingAssetId === undefined) {
      res.status(404).json({ status: "error", error: { message: "Asset tag does not exist" } });
      return;
    }

    res.status(403).json({ status: "error", error: { message: "Asset is outside your department access scope" } });
  } catch (error) {
    console.error(`Error in lookup asset by tag endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not lookup asset by tag number" } });
  }
}

export async function viewAssetDetailsHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const assetId = Number(id);
    const asset = await getAssetDetails(assetId, scope.isAdmin ? undefined : scope.departmentIds);
    if (asset === undefined) {
      const existingAsset = await getAssetDetails(assetId);
      if (existingAsset === undefined) {
        res.status(404).json({ status: "error", error: { message: "Asset does not exist" } });
        return;
      }

      res.status(403).json({ status: "error", error: { message: "Asset is outside your department access scope" } });
      return;
    }
    res.json({ status: "success", data: asset });
  } catch (error) {
    console.error(`Error in listAssetOverviews endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all assets" } });
  }
}