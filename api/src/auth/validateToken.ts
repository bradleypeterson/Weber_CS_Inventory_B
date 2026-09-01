import { JSONSchemaType } from "ajv";
import type { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { ajv } from "../ajv";

export function validateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ status: "error", error: { message: "Unauthenticated" } });
    return;
  }

  try {
    const user = verify(token, process.env.JWT_SECRET!);
    res.locals.user = user;
    next();
  } catch (error) {
    res.status(401).json({ status: "error", error: { message: "Unauthenticated" } });
    return;
  }
}

type User = {
  UserID: number;
  PersonID: number;
  Salt: string;
  Permissions: number[];
};
const userSchema: JSONSchemaType<User> = {
  type: "object",
  properties: {
    UserID: { type: "number" },
    PersonID: { type: "number" },
    Salt: { type: "string" },
    Permissions: { type: "array", items: { type: "number" } }
  },
  required: ["Permissions", "PersonID", "Salt", "UserID"]
};
export const validateUser = ajv.compile(userSchema);
