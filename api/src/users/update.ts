import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { dbUpdateUser, getUserDetails } from "../db/procedures/users";
import { logSystemNote } from "../systemNotes/logSystemNote";
import {
  USER_ENTITY_TYPE,
  formatUserUpdateNote,
  pickUserUpdatesForSystemNote
} from "./userSystemNotes";

export async function updateUser(req: Request, res: Response) {
  try {
    const updates: unknown = req.body;
    const { id } = req.params;
    if (!validateUpdates(updates) || !id) {
      res.status(400).json({ status: "error", error: { message: "invalid updates" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const personID = Number(id);
    const existing = await getUserDetails(personID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "User does not exist" } });
      return;
    }

    const auditUpdates = pickUserUpdatesForSystemNote(
      updates as Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
    );

    await dbUpdateUser(personID, updates);

    if (Object.keys(auditUpdates).length > 0) {
      try {
        await logSystemNote({
          entityType: USER_ENTITY_TYPE,
          entityID: personID,
          note: formatUserUpdateNote(personID, existing, auditUpdates),
          performedBy: user.UserID,
          action: "Updated"
        });
      } catch (logError) {
        console.error("Failed to write system note for user update:", logError);
      }
    }

    res.status(200).json({ status: "success", data: {}});
    return;

  } catch (error) {
    console.error("Error in updateUser endpoint", error);
    res.status(500).json({ status: "error", error: { message: "An error occurred while updating user" } });
    return;
  }
}

const updateUserSchema: JSONSchemaType<
  Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
> = {
  type: "object",
  properties: {
    WNumber: {type: "string"},
    FirstName: { type: "string" },
    LastName: { type: "string" },
    DepartmentID: { type: "array", items: { type: "number" } },
    BuildingID: { type: "number" },
    LocationID: { type: "number"},
    Permissions: { type: "array", items: { type: "number" } },
  },
  required: [],
  additionalProperties: true
};

const validateUpdates = ajv.compile(updateUserSchema);