import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { deleteAssetClass, getAssetClassById } from "../db/procedures/assetClass";

export async function deleteAssetClassHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ status: "error", error: { message: "Invalid asset class ID" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const assetClassID = Number(id);
    const existing = await getAssetClassById(assetClassID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "Asset class does not exist" } });
      return;
    }

    await deleteAssetClass(assetClassID, user.UserID, existing);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in deleteAssetClass endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not delete asset class" } });
  }
}
