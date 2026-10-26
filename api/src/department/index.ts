import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { addDepartmentHandler } from "./add";
import { deleteDepartmentHandler } from "./delete";
import { listDepartments } from "./list";
import { restoreDepartmentHandler } from "./restore";
import { updateDepartmentHandler } from "./update";

export const departmentRouter = Router();

const canManageListOptions = requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS);

departmentRouter.get("/list", listDepartments);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
departmentRouter.post("/add", canManageListOptions, addDepartmentHandler);
departmentRouter.post("/:id/update", canManageListOptions, updateDepartmentHandler);
departmentRouter.post("/:id/delete", canManageListOptions, deleteDepartmentHandler);

departmentRouter.post("/:id/restore", canManageListOptions, restoreDepartmentHandler);
