import type { Request, Response } from "express";
import { getAllPermissions } from "../db/procedures/permissions";

export async function listPermissions(req: Request, res: Response) {
  try {
    const rows = await getAllPermissions();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listPermissions endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all permissions" } });
  }
}