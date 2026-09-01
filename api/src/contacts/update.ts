import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { dbUpdateContact, getContactDetails } from "../db/procedures/contacts";
import { logSystemNote } from "../systemNotes/logSystemNote";
import {
  CONTACT_ENTITY_TYPE,
  formatContactUpdateNote,
  hasContactFieldChanges,
  pickContactFieldsForSystemNote
} from "./contactSystemNotes";

export async function updateContact(req: Request, res: Response) {
  try {
    const params: unknown = req.body;
    if (!validateUpdates(params)) {
      res.status(400).json({ status: "error", error: { message: "Invalid updates" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const personID = Number(params.personID);
    const existing = await getContactDetails(personID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "Contact does not exist" } });
      return;
    }

    const auditUpdates = pickContactFieldsForSystemNote({
      WNumber: params.WNumber,
      FirstName: params.FirstName,
      LastName: params.LastName,
      DepartmentID: params.DepartmentID,
      BuildingID: params.BuildingID,
      LocationID: params.LocationID
    });

    await dbUpdateContact(params.personID, params.WNumber, params.FirstName, params.LastName,
      params.DepartmentID, params.BuildingID, params.LocationID
    );

    if (hasContactFieldChanges(existing, auditUpdates)) {
      try {
        await logSystemNote({
          entityType: CONTACT_ENTITY_TYPE,
          entityID: personID,
          note: formatContactUpdateNote(personID, existing, auditUpdates),
          performedBy: user.UserID,
          action: "Updated"
        });
      } catch (logError) {
        console.error("Failed to write system note for contact update:", logError);
      }
    }

    res.status(200).json({ status: "success", data: { personID: params.personID } });
    return;

  } catch (error) {
    console.error("Error in updateContact endpoint", error);
    res.status(500).json({ status: "error", error: { message: "An error occurred while updating contact" } });
  }
}

const updateContactParamsSchema: JSONSchemaType<{
  personID: string; WNumber: string; FirstName: string; LastName: string; 
  DepartmentID: number[]; BuildingID: number; LocationID: number;
}> = {
  type: "object",
  properties: {
    personID: { type: "string" },
    WNumber: { type: "string" },
    FirstName: { type: "string" },
    LastName: { type: "string" },
    DepartmentID: { type: "array", items: { type: "number" } },
    BuildingID: { type: "number"},
    LocationID: { type: "number"},
    },
    required: ["personID", "WNumber", "FirstName", "LastName", "DepartmentID", "BuildingID", "LocationID"],
};
const validateUpdates = ajv.compile(updateContactParamsSchema);