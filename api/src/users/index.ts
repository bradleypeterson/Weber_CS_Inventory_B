import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { addUser } from "./add";
import { archiveUsers } from "./archive";
import { userDetails } from "./details";
import { listUsers } from "./list";
import { promoteContactToUser } from "./promote";
import { updateUser } from "./update";

export const userRouter = Router();

const canManageUsers = requirePermission(PermissionId.ADD_EDIT_VIEW_USERS);
const canSetUserPermissions = requirePermission(PermissionId.SET_USER_PERMISSIONS);

userRouter.get("/list", canManageUsers, listUsers);
userRouter.get("/:id", canManageUsers, userDetails);
userRouter.post("/archive", canManageUsers, archiveUsers);
userRouter.post("/:id/update", canManageUsers, updateUser);
userRouter.post("/add", canManageUsers, canSetUserPermissions, addUser);
userRouter.post("/promote", canManageUsers, canSetUserPermissions, promoteContactToUser);