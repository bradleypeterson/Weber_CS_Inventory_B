import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { deleteDeviceType, getDeviceTypeById } from "../db/procedures/deviceTypes";

export async function deleteDeviceTypeHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ status: "error", error: { message: "Invalid device type ID" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const deviceTypeID = Number(id);
    const existing = await getDeviceTypeById(deviceTypeID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "Device type does not exist" } });
      return;
    }

    await deleteDeviceType(deviceTypeID, user.UserID, existing);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in deleteDeviceType endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not delete device type" } });
  }
}
