import type { Request, Response } from "express";
import { getAllRooms } from "../db/procedures/rooms";

export async function listRooms(req: Request, res: Response) {
  try {
    const rows = await getAllRooms();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listRooms endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all rooms" } });
  }
}
