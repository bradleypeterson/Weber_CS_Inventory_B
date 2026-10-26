import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { addAssetClassHandler } from "./add";
import { deleteAssetClassHandler } from "./delete";
import { listAssetClasses } from "./list";
import { restoreAssetClassHandler } from "./restore";
import { updateAssetClassHandler } from "./update";

export const assetClassRouter = Router();

assetClassRouter.get("/list", listAssetClasses);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
assetClassRouter.post("/add", requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS), addAssetClassHandler);
assetClassRouter.post("/:id/update", requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS), updateAssetClassHandler);
assetClassRouter.post("/:id/delete", requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS), deleteAssetClassHandler);

assetClassRouter.post("/:id/restore", requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS), restoreAssetClassHandler);