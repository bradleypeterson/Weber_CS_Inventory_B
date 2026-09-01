import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { archiveContactsProcedure, getActivePersonIdsByIds } from "../db/procedures/contacts";

type Params = {
  personIds: number[];
};

const paramsSchema: JSONSchemaType<Params> = {
  type: "object",
  properties: {
    personIds: {
      type: "array",
      items: { type: "number" }
    }
  },
  required: ["personIds"],
  additionalProperties: false
};

const validateParams = ajv.compile(paramsSchema);

export async function archiveContacts(req: Request, res: Response) {
  const params: unknown = req.body;
  const user: unknown = res.locals.user;
  if (!validateParams(params) || params.personIds.length === 0) {
    res.status(400).json({ status: "error", error: { message: "Invalid request params" } });
    return;
  }

  if (!validateUser(user)) {
    res.status(401).json({ status: "error", error: { message: "Unknown User" } });
    return;
  }

  const uniquePersonIds = [...new Set(params.personIds)];

  try {
    const existingPersonIds = await getActivePersonIdsByIds(uniquePersonIds);
    if (existingPersonIds.length !== uniquePersonIds.length) {
      res.status(404).json({ status: "error", error: { message: "One or more contacts do not exist" } });
      return;
    }

    await archiveContactsProcedure(user.UserID, uniquePersonIds);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error(`Error archiveContacts endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not archive contacts" } });
  }
}
