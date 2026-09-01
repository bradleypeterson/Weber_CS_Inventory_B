import type { Request, Response } from "express";
import type { Building } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { getBuildingById, updateBuilding } from "../db/procedures/buildings";
import { logSystemNote } from "../systemNotes/logSystemNote";
import {
  BUILDING_ENTITY_TYPE,
  formatBuildingUpdateNote,
  hasBuildingFieldChanges
} from "./buildingSystemNotes";

const buildingSchema = {
  type: "object",
  properties: {
    BuildingID: { type: "number" },
    Name: { type: "string" },
    Abbreviation: { type: "string" }
  },
  required: ["Name", "Abbreviation"]
};

const validateBuilding = ajv.compile(buildingSchema);

export async function updateBuildingHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const building = req.body as Partial<Building>;

    if (!id || isNaN(Number(id)) || !validateBuilding(building)) {
      res.status(400).json({ status: "error", error: { message: "Invalid building data" } });
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

    building.BuildingID = buildingID;

    const updates = { Name: building.Name as string, Abbreviation: building.Abbreviation as string };

    await updateBuilding(building as Building);

    if (hasBuildingFieldChanges(existing, updates)) {
      try {
        await logSystemNote({
          entityType: BUILDING_ENTITY_TYPE,
          entityID: buildingID,
          note: formatBuildingUpdateNote(buildingID, existing, updates),
          performedBy: user.UserID,
          action: "Updated"
        });
      } catch (logError) {
        console.error("Failed to write system note for building update:", logError);
      }
    }

    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in updateBuilding endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not update building" } });
  }
}

