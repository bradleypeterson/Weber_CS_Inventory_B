import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { createToken } from ".";
import { ajv } from "../ajv";
import { getUserDetailsByWNumber } from "../db/procedures/auth";

export async function login(req: Request, res: Response) {
  const params: unknown = req.body;
  if (!validateParams(params)) {
    res.status(400).json({ status: "error", error: { message: "Invalid request" } });
    return;
  }

  const user = await getUserDetailsByWNumber(params.wNumber);
  if (user !== null && user.HashedPassword !== undefined && params.password === user.HashedPassword) {
    // Correct password
    delete user.HashedPassword;
    const token = createToken(user);
    res.json({ status: "success", data: { token, permissions: user.Permissions, personID: user.PersonID } });
    return;
  }

  res.status(400).json({ status: "error", error: { message: "Invalid UserId or Password" } });
}

const paramsSchema: JSONSchemaType<{ wNumber: string; password: string }> = {
  type: "object",
  properties: {
    wNumber: { type: "string" },
    password: { type: "string" }
  },
  required: ["wNumber", "password"]
};

const validateParams = ajv.compile(paramsSchema);
