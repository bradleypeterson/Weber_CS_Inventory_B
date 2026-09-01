import type { Request, Response } from "express";
import { getEquipmentByLocation, getEquipmentByTagNumber } from "../db/procedures/audits";

export async function scanItem(req: Request, res: Response) {
  try {
    const { itemBarcode, roomId } = req.body;
    
    if (!itemBarcode || !roomId) {
      res.status(400).json({
        status: "error",
        error: { message: "Missing required fields" }
      });
      return;
    }

    // Get equipment in the room
    const equipment = await getEquipmentByLocation(Number(roomId));
    
    // Find the scanned item in the room's equipment
    const scannedItem = equipment.find(item => String(item.TagNumber) === String(itemBarcode));

    // If not found in room, check if it exists at all
    if (!scannedItem) {
      const validItem = await getEquipmentByTagNumber(String(itemBarcode));
      
      if (!validItem) {
        res.status(404).json({
          status: "error",
          error: { message: "Item not found" }
        });
        return;
      }

      // Item exists but not in this room
      res.json({
        status: "not_assigned_to_room",
        data: validItem
      });
      return;
    }

    // Return the found item
    res.json({
      status: "success",
      data: scannedItem
    });

  } catch (error) {
    console.error("Error in scanItem:", error);
    res.status(500).json({
      status: "error",
      error: { message: "Failed to process item scan" }
    });
  }
} 