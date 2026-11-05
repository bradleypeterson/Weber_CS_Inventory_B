import type { RequestHandler } from "express";
import { hasPermission, type PermissionIdValue } from "../../../@types/permissions";
import { validateUser } from "./validateToken";

export function requirePermission(permissionId: PermissionIdValue): RequestHandler {
  return (_req, res, next) => {
    const user: unknown = res.locals.user;

    if (!validateUser(user)) {
      res.status(401).json({
        status: "error",
        error: { message: "Unknown user" }
      });
      return;
    }

    if (!hasPermission(user.Permissions, permissionId)) {
      res.status(403).json({
        status: "error",
        error: { message: "Permission denied" }
      });
      return;
    }

    next();
  };
}

export function requirePermissionOrSelf(
  permissionId: PermissionIdValue,
  personIdParam = "id"
): RequestHandler {
  return (req, res, next) => {
    const user: unknown = res.locals.user;

    if (!validateUser(user)) {
      res.status(401).json({
        status: "error",
        error: { message: "Unknown user" }
      });
      return;
    }

    const targetPersonId = Number(req.params[personIdParam]);
    const isSelf = Number.isSafeInteger(targetPersonId) &&
      targetPersonId > 0 &&
      targetPersonId === user.PersonID;

    if (!isSelf && !hasPermission(user.Permissions, permissionId)) {
      res.status(403).json({
        status: "error",
        error: { message: "Permission denied" }
      });
      return;
    }

    next();
  };
}