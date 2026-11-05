import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { addDeviceTypeHandler } from "./add";
import { deleteDeviceTypeHandler } from "./delete";
import { listDeviceTypes } from "./list";
import { restoreDeviceTypeHandler } from "./restore";
import { updateDeviceTypeHandler } from "./update";

export const deviceTypeRouter = Router();

const canManageListOptions = requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS);

deviceTypeRouter.get("/list", listDeviceTypes);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
deviceTypeRouter.post("/add", canManageListOptions, addDeviceTypeHandler);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
deviceTypeRouter.post("/:id/update", canManageListOptions, updateDeviceTypeHandler);
deviceTypeRouter.post("/:id/delete", canManageListOptions, deleteDeviceTypeHandler);

deviceTypeRouter.post("/:id/restore", canManageListOptions, restoreDeviceTypeHandler);
