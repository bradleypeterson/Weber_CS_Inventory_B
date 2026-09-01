import type { Request, Response } from "express";
import { getAllDeviceTypes } from "../db/procedures/deviceTypes";

export async function listDeviceTypes(req: Request, res: Response) {
  try {
    const rows = await getAllDeviceTypes();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listDeviceTypes endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all device types" } });
  }
}