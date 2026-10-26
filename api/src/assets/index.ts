import { Router } from "express";
import { addAssetHandler } from "./add";
import { archiveAssets } from "./archive";
import { exportAssetsByIds } from "./export";
import { listAssetOverviews, listAssets } from "./list";
import { addNewAssetNoteHandler, assetNotesHanlder } from "./notes";
import { getConditions, getDeviceTypes } from "./options";
import { updateAsset } from "./update";
import { lookupAssetByTagHandler, viewAssetDetailsHandler } from "./view-details";

import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
export const assetRouter = Router();

assetRouter.post("/add", requirePermission(PermissionId.ADD_EDIT_ASSETS), addAssetHandler);
assetRouter.post("/archive", requirePermission(PermissionId.ARCHIVE_ASSETS), archiveAssets);
assetRouter.post("/export", exportAssetsByIds);

assetRouter.get("/conditions", getConditions);
assetRouter.get("/types", getDeviceTypes);
assetRouter.get("/list", listAssets);
assetRouter.get("/list/overview", listAssetOverviews);
assetRouter.get("/lookup/tag/:tagNumber", lookupAssetByTagHandler);

assetRouter.post("/:id/update", requirePermission(PermissionId.ADD_EDIT_ASSETS), updateAsset);
assetRouter.get("/:id/notes", assetNotesHanlder);
assetRouter.post("/:id/notes/", requirePermission(PermissionId.ADD_EDIT_ASSETS), addNewAssetNoteHandler);
assetRouter.get("/:id", viewAssetDetailsHandler);
