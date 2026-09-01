import type { Request, Response } from "express";
import { getEquipmentByLocation, validateRoomBarcode } from "../db/procedures/audits";

interface RequestUser {
  UserID: number;
}

interface AuditRequestBody {
  roomBarcode: string;
}

export async function initiateAudit(req: Request<unknown, unknown, AuditRequestBody>, res: Response) {
  try {
    const { roomBarcode } = req.body;
    const user = res.locals.user as RequestUser;

    // Validate room barcode
    const room = await validateRoomBarcode(roomBarcode);
    if (!room) {
      res.status(404).json({ 
        status: "error", 
        error: { message: "Invalid room barcode" } 
      });
      return;
    }

    // Get equipment in the room (but don't fail if empty)
    const equipment = await getEquipmentByLocation(room.LocationID);
    console.log(`Found ${equipment.length} items in room ${roomBarcode}`);
    
    res.json({ 
      status: "success", 
      data: { 
        roomNumber: room.RoomNumber,
        locationId: room.LocationID,
        equipmentCount: equipment.length,
        isEmptyRoom: equipment.length === 0
      } 
    });
  } catch (error) {
    console.error("Error in initiateAudit endpoint:", error);
    res.status(500).json({ 
      status: "error", 
      error: { message: "Failed to initiate audit" } 
    });
  }
}