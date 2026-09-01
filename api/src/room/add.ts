import type { Request, Response } from "express";
import type { Room } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { addRoom } from "../db/procedures/rooms";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { ROOM_ENTITY_TYPE, formatRoomCreatedNote } from "./roomSystemNotes";

const roomSchema = {
  type: "object",
  properties: {
    RoomNumber: { type: "string" },
    BuildingID: { type: "number" },
    Barcode: { type: "string" }
  },
  required: ["RoomNumber", "BuildingID", "Barcode"],
  additionalProperties: false
};

const validateRoom = ajv.compile<Omit<Room, "LocationID">>(roomSchema);

export async function addRoomHandler(req: Request, res: Response) {
  try {
    const room: unknown = req.body;

    if (!validateRoom(room)) {
      return res.status(400).json({
        status: "error",
        error: { message: "Invalid room data", details: validateRoom.errors }
      });
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      return res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    }

    const roomId = await addRoom(room);
    try {
      await logSystemNote({
        entityType: ROOM_ENTITY_TYPE,
        entityID: roomId,
        note: formatRoomCreatedNote(roomId, room.RoomNumber, room.BuildingID, room.Barcode),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for room create:", logError);
    }
    return res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in addRoom endpoint:", error);
    return res.status(500).json({ status: "error", error: { message: "Could not add room" } });
  }
}

