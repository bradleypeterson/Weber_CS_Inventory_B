import type { Request, Response } from "express";
import { getAllConditions } from "../db/procedures/conditions";

export async function listConditions(req: Request, res: Response) {
  try {
    const rows = await getAllConditions();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listConditions endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all conditions" } });
  }
}