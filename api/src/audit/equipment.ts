import type { Request, Response } from "express";
import { getEquipmentByLocation } from "../db/procedures/audits";

export async function getEquipmentForRoom(req: Request, res: Response) {
  try {
    const locationId = Number(req.params.roomId);
    if (isNaN(locationId)) {
      res.status(400).json({ 
        status: "error", 
        error: { message: "Invalid room ID" } 
      });
      return;
    }

    const equipment = await getEquipmentByLocation(locationId);
    res.json({ 
      status: "success", 
      data: equipment 
    });
  } catch (error) {
    console.error("Error in getEquipmentForRoom:", error);
    res.status(500).json({ 
      status: "error", 
      error: { message: "Failed to get equipment for room" } 
    });
  }
} 