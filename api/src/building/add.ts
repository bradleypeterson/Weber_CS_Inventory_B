import type { Request, Response } from "express";
import type { Building } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { addBuilding } from "../db/procedures/buildings";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { BUILDING_ENTITY_TYPE, formatBuildingCreatedNote } from "./buildingSystemNotes";

const buildingSchema = {
  type: "object",
  properties: {
    Name: { type: "string" },
    Abbreviation: { type: "string" }
  },
  required: ["Name", "Abbreviation"],
  additionalProperties: false
};

const validateBuilding = ajv.compile<Omit<Building, "BuildingID">>(buildingSchema);

export async function addBuildingHandler(req: Request, res: Response) {
  try {
    const building: unknown = req.body;

    if (!validateBuilding(building)) {
      return res.status(400).json({
        status: "error",
        error: { message: "Invalid building data", details: validateBuilding.errors }
      });
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      return res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    }

    const buildingId = await addBuilding(building);
    try {
      await logSystemNote({
        entityType: BUILDING_ENTITY_TYPE,
        entityID: buildingId,
        note: formatBuildingCreatedNote(buildingId, building.Name, building.Abbreviation),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for building create:", logError);
    }
    return res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in addBuilding endpoint:", error);
    return res.status(500).json({ status: "error", error: { message: "Could not add building" } });
  }
}

