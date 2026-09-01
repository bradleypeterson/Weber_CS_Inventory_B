import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { dbAddUser } from "../db/procedures/users";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { USER_ENTITY_TYPE, formatUserCreatedNote } from "./userSystemNotes";

export async function addUser(req: Request, res: Response) {
  try {
    const details: unknown = req.body;
    if (!validateDetails(details)) {
      res.status(400).json({ status: "error", error: { message: "Invalid user to add" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    console.log(details);
    const personID = await dbAddUser(details);
    try {
      await logSystemNote({
        entityType: USER_ENTITY_TYPE,
        entityID: personID,
        note: formatUserCreatedNote(
          personID,
          String(details.WNumber ?? ""),
          String(details.FirstName ?? ""),
          String(details.LastName ?? "")
        ),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for user create:", logError);
    }
    res.status(200).json({ status: "success", data: {} });
    return;

  } catch (error) {
    console.error("Error in addContact endpoint", error);
    res.status(500).json({ status: "error", error: { message: "An error occurred while adding contact" } });
    return;
  }
}

const addSchema: JSONSchemaType<
  Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
> = {
  type: "object",
  properties: {
    hashedNewPassword: { type: "string"},
    Salt: {type: "string"},
    WNumber: { type: "string" },
    FirstName: { type: "string" },
    LastName: { type: "string" },
    DepartmentID: { type: "array", items: { type: "number" } },
    BuildingID: { type: "number"},
    LocationID: { type: "number"},
    Permissions: { type: "array", items: { type: "number" } },
  },
  required: [],
  additionalProperties: true
};

const validateDetails = ajv.compile(addSchema);