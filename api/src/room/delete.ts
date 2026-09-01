import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { deleteRoom, getRoomById } from "../db/procedures/rooms";

export async function deleteRoomHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ status: "error", error: { message: "Invalid room id" } });
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

    await deleteRoom(locationID, user.UserID, existing);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in deleteRoom endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not delete room" } });
  }
}

