import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import {
  requirePermission,
  requirePermissionForBodyField,
  requirePermissionOrSelf
} from "../auth/requirePermission";
import { addUser } from "./add";
import { archiveUsers } from "./archive";
import { userDetails } from "./details";
import { listUsers } from "./list";
import { promoteContactToUser } from "./promote";
import { updateUser } from "./update";

export const userRouter = Router();

const canManageUsers = requirePermission(PermissionId.ADD_EDIT_VIEW_USERS);
const canSetUserPermissions = requirePermission(PermissionId.SET_USER_PERMISSIONS);
const canChangeUserPermissions = requirePermissionForBodyField(PermissionId.SET_USER_PERMISSIONS, "Permissions");

userRouter.get("/list", canManageUsers, listUsers);
userRouter.get("/:id", requirePermissionOrSelf(PermissionId.ADD_EDIT_VIEW_USERS), userDetails);
userRouter.post("/archive", canManageUsers, archiveUsers);
userRouter.post("/:id/update", canManageUsers, canChangeUserPermissions, updateUser);
userRouter.post("/add", canManageUsers, canSetUserPermissions, addUser);
userRouter.post("/promote", canManageUsers, canSetUserPermissions, promoteContactToUser);