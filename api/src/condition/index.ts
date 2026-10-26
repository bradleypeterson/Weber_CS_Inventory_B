import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { addConditionHandler } from "./add";
import { deleteConditionHandler } from "./delete";
import { listConditions } from "./list";
import { restoreConditionHandler } from "./restore";
import { updateConditionHandler } from "./update";

export const conditionRouter = Router();

const canManageListOptions = requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS);

conditionRouter.get("/list", listConditions);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
conditionRouter.post("/add", canManageListOptions, addConditionHandler);
conditionRouter.post("/:id/update", canManageListOptions, updateConditionHandler);
conditionRouter.post("/:id/delete", canManageListOptions, deleteConditionHandler);

conditionRouter.post("/:id/restore", canManageListOptions, restoreConditionHandler);
