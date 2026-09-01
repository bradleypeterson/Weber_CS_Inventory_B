import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { changePassword, getUserDetails } from "../db/procedures/auth";
import { canResetUserPasswords } from "./passwordResetPermission";
import { validateUser } from "./validateToken";

export async function updatePassword(req: Request, res: Response) {
  const params: unknown = req.body;
  if (!validateParams(params)) {
    res.status(400).json({ status: "error", error: { message: "Invalid request" } });
    return;
  }

  const requester: unknown = res.locals.user;
  if (!validateUser(requester)) {
    res.status(401).json({ status: "error", error: { message: "Unauthenticated" } });
    return;
  }

  try {
    const user = await getUserDetails(params.userID);
    if (!user) {
      res.status(401).json({ status: "error", error: { message: "Invalid user" } });
      return;
    }

    if (params.updateType === "admin") {
      if (!canResetUserPasswords(requester)) {
        res.status(403).json({ status: "error", error: { message: "Unauthorized" } });
        return;
      }

      await changePassword(params.userID, params.hashedNewPassword, params.newSalt);
      res.status(200).json({ status: "success", data: { userID: params.userID } });
      return;
    }

    if (params.updateType !== "personal") {
      res.status(400).json({ status: "error", error: { message: "Invalid request" } });
      return;
    }

    if (requester.UserID.toString() !== params.userID) {
      res.status(403).json({ status: "error", error: { message: "Unauthorized" } });
      return;
    }

    if (user.HashedPassword !== params.hashedOldPassword) {
      res.status(401).json({ status: "error", error: { message: "Invalid old password" } });
      return;
    }

    await changePassword(params.userID, params.hashedNewPassword, params.newSalt);
    res.status(200).json({ status: "success", data: { userID: params.userID } });
    return;
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error: Password change failed" });
    return;
  }
}

const passwordParamsSchema: JSONSchemaType<{ userID: string; hashedOldPassword: string; hashedNewPassword: string; newSalt: string; updateType: string }> = {
  type: "object",
  properties: {
    userID: { type: "string" },
    hashedOldPassword: { type: "string" },
    hashedNewPassword: { type: "string" },
    newSalt: { type: "string" },
    updateType: { type: "string" }
  },
  required: ["userID", "hashedOldPassword", "hashedNewPassword", "newSalt", "updateType"]
};

const validateParams = ajv.compile(passwordParamsSchema);
