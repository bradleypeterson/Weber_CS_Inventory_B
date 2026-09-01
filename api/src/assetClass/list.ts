import type { Request, Response } from "express";
import { getAllAssetClasses } from "../db/procedures/assetClass";

export async function listAssetClasses(req: Request, res: Response) {
  try {
    const rows = await getAllAssetClasses();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listAssetClasses endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all asset classes" } });
  }
}
