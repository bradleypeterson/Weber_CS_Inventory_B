import type { Request, Response } from "express";
import { getAllBuildings } from "../db/procedures/buildings";

export async function listBuildings(req: Request, res: Response) {
  try {
    const rows = await getAllBuildings();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listBuildings endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all buildings" } });
  }
}
