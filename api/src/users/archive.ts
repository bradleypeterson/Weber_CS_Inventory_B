import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { archiveUsersProcedure, getActiveUserPersonIdsByIds } from "../db/procedures/users";

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

export async function archiveUsers(req: Request, res: Response) {
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

  if (params.personIds.includes(user.PersonID)) {
    res.status(403).json({ status: "error", error: { message: "You cannot archive your own account" } });
    return;
  }

  const uniquePersonIds = [...new Set(params.personIds)];

  try {
    const existingPersonIds = await getActiveUserPersonIdsByIds(uniquePersonIds);
    if (existingPersonIds.length !== uniquePersonIds.length) {
      res.status(404).json({ status: "error", error: { message: "One or more users do not exist" } });
      return;
    }

    await archiveUsersProcedure(user.UserID, uniquePersonIds);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error(`Error archiveUsers endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not archive users" } });
  }
}
