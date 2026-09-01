import type { Request, Response } from "express";
import type { Room } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { getRoomById, updateRoom } from "../db/procedures/rooms";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { ROOM_ENTITY_TYPE, formatRoomUpdateNote, hasRoomFieldChanges } from "./roomSystemNotes";

const roomSchema = {
  type: "object",
  properties: {
    LocationID: { type: "number" },
    RoomNumber: { type: "string" },
    BuildingID: { type: "number" },
    Barcode: { type: "string" }
  },
  required: ["RoomNumber", "BuildingID", "Barcode"]
};

const validateRoom = ajv.compile(roomSchema);

export async function updateRoomHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const room = req.body as Partial<Room>;

    if (!id || isNaN(Number(id)) || !validateRoom(room)) {
      res.status(400).json({ status: "error", error: { message: "Invalid room data" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const locationID = Number(id);
    const existing = await getRoomById(locationID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "Room does not exist" } });
      return;
    }

    room.LocationID = locationID;
    const updates = {
      RoomNumber: room.RoomNumber as string,
      BuildingID: room.BuildingID as number,
      Barcode: room.Barcode as string
    };

    await updateRoom(room as Room);

    if (hasRoomFieldChanges(existing, updates)) {
      try {
        await logSystemNote({
          entityType: ROOM_ENTITY_TYPE,
          entityID: locationID,
          note: formatRoomUpdateNote(locationID, existing, updates),
          performedBy: user.UserID,
          action: "Updated"
        });
      } catch (logError) {
        console.error("Failed to write system note for room update:", logError);
      }
    }

    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in updateRoom endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not update room" } });
  }
}

