import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { dbAddContact } from "../db/procedures/contacts";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { CONTACT_ENTITY_TYPE, formatContactCreatedNote } from "./contactSystemNotes";

export async function addContact(req: Request, res: Response) {
  try {
    const params: unknown = req.body;
    if (!validateUpdates(params)) {
      res.status(400).json({ status: "error", error: { message: "Invalid contact to add" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const personID = await dbAddContact(params.WNumber, params.FirstName, params.LastName,
      params.DepartmentID, params.BuildingID, params.LocationID
    );
    try {
      await logSystemNote({
        entityType: CONTACT_ENTITY_TYPE,
        entityID: personID,
        note: formatContactCreatedNote(personID, params.WNumber, params.FirstName, params.LastName),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for contact create:", logError);
    }
    res.status(200).json({ status: "success", data: { WNumber: params.WNumber } });
    return;

  } catch (error) {
    console.error("Error in addContact endpoint", error);
    res.status(500).json({ status: "error", error: { message: "An error occurred while adding contact" } });
  }
}

const addContactParamsSchema: JSONSchemaType<{
  WNumber: string; FirstName: string; LastName: string; 
  DepartmentID: number[]; BuildingID: number; LocationID: number;
}> = {
  type: "object",
  properties: {
    WNumber: { type: "string" },
    FirstName: { type: "string" },
    LastName: { type: "string" },
    DepartmentID: { type: "array", items: { type: "number" } },
    BuildingID: { type: "number"},
    LocationID: { type: "number"},
    },
    required: ["WNumber", "FirstName", "LastName", "DepartmentID", "BuildingID", "LocationID"],
};
const validateUpdates = ajv.compile(addContactParamsSchema);