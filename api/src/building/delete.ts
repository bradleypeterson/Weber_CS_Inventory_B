import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { deleteBuilding, getBuildingById } from "../db/procedures/buildings";

export async function deleteBuildingHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ status: "error", error: { message: "Invalid building id" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const buildingID = Number(id);
    const existing = await getBuildingById(buildingID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "Building does not exist" } });
      return;
    }

    await deleteBuilding(buildingID, user.UserID, existing);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in deleteBuilding endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not delete building" } });
  }
}

