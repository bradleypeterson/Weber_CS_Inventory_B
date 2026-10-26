import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { addBuildingHandler } from "./add";
import { deleteBuildingHandler } from "./delete";
import { listBuildings } from "./list";
import { restoreBuildingHandler } from "./restore";
import { updateBuildingHandler } from "./update";

export const buildingRouter = Router();

const canManageListOptions = requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS);

buildingRouter.get("/list", listBuildings);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
buildingRouter.post("/add", canManageListOptions, addBuildingHandler);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
buildingRouter.post("/:id/update", canManageListOptions, updateBuildingHandler);
buildingRouter.post("/:id/delete", canManageListOptions, deleteBuildingHandler);
buildingRouter.post("/:id/restore", canManageListOptions, restoreBuildingHandler);
