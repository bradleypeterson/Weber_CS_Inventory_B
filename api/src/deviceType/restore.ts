import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { restoreDeviceType } from "../db/procedures/deviceTypes";

export async function restoreDeviceTypeHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ status: "error", error: { message: "Invalid device type id" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    await restoreDeviceType(Number(id), user.UserID);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in restoreDeviceType endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not restore device type" } });
  }
}
