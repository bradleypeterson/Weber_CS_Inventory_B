import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { dbPromoteContactToUser } from "../db/procedures/users";

type PromoteParams = {
  personID: number;
  hashedNewPassword: string;
  Salt: string;
  WNumber: string;
  FirstName: string;
  LastName: string;
  DepartmentID: number[];
  LocationID: number;
  Permissions: number[];
};

export async function promoteContactToUser(req: Request, res: Response) {
  try {
    const details: unknown = req.body;
    if (!validateDetails(details)) {
      res.status(400).json({ status: "error", error: { message: "Invalid user promotion payload" } });
      return;
    }

    await dbPromoteContactToUser(details);
    res.status(200).json({ status: "success", data: {} });
    return;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PERSON_NOT_FOUND") {
        res.status(404).json({ status: "error", error: { message: "Contact person does not exist" } });
        return;
      }
      if (error.message === "USER_ALREADY_EXISTS") {
        res.status(409).json({ status: "error", error: { message: "Contact is already an active user" } });
        return;
      }
      if (error.message === "INVALID_PERSON_ID") {
        res.status(400).json({ status: "error", error: { message: "Invalid person ID" } });
        return;
      }
    }
    console.error("Error in promoteContactToUser endpoint", error);
    res.status(500).json({ status: "error", error: { message: "An error occurred while promoting contact to user" } });
    return;
  }
}

const promoteSchema: JSONSchemaType<PromoteParams> = {
  type: "object",
  properties: {
    personID: { type: "number" },
    hashedNewPassword: { type: "string" },
    Salt: { type: "string" },
    WNumber: { type: "string" },
    FirstName: { type: "string" },
    LastName: { type: "string" },
    DepartmentID: { type: "array", items: { type: "number" } },
    LocationID: { type: "number" },
    Permissions: { type: "array", items: { type: "number" } }
  },
  required: [
    "personID",
    "hashedNewPassword",
    "Salt",
    "WNumber",
    "FirstName",
    "LastName",
    "DepartmentID",
    "LocationID",
    "Permissions"
  ],
  additionalProperties: true
};

const validateDetails = ajv.compile(promoteSchema);
