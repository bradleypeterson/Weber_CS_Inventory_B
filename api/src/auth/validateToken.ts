import { JSONSchemaType } from "ajv";
import type { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { ajv } from "../ajv";
import { isSessionActive } from "../db/procedures/sessions";

export async function validateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ status: "error", error: { message: "Unauthenticated" } });
    return;
  }

  let user;
  try {
    user = verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    res.status(401).json({ status: "error", error: { message: "Unauthenticated" } });
    return;
  }

  if (!validateUser(user) || typeof user.SessionID !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.SessionID)) {
    res.status(401).json({ status: "error", error: { message: "Unauthenticated" } });
    return;
  }

  try {
    if (!await isSessionActive(user.SessionID, user.UserID)) {
      res.status(401).json({ status: "error", error: { message: "Session expired", code: "SESSION_EXPIRED" } });
      return;
    }
  } catch {
    res.status(503).json({ status: "error", error: { message: "Session service unavailable" } });
    return;
  }
  res.locals.user = user;
  next();
}

type User = {
  UserID: number;
  PersonID: number;
  Salt: string;
  Permissions: number[];
  SessionID?: string;
};
const userSchema: JSONSchemaType<User> = {
  type: "object",
  properties: {
    UserID: { type: "number" },
    PersonID: { type: "number" },
    Salt: { type: "string" },
    Permissions: { type: "array", items: { type: "number" } },
    SessionID: { type: "string", nullable: true }
  },
  required: ["Permissions", "PersonID", "Salt", "UserID"]
};
export const validateUser = ajv.compile(userSchema);
