import type { Request, Response } from "express";
import { getPendingAssetRequests } from "../db/procedures/approvalRequests";

export async function listPendingAssetRequests(_req: Request, res: Response) {
  try {
    const requests = await getPendingAssetRequests();
    res.json({ status: "success", data: requests });
  } catch (error) {
    console.error("Error listing pending asset requests:", error);
    res.status(500).json({ status: "error", error: { message: "Could not fetch pending asset requests" } });
  }
}