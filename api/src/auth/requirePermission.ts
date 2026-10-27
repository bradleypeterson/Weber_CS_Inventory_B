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