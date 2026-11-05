import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { importAssetsHandler, previewImportHandler } from "./import";

export const importRouter = Router();

importRouter.post("/", requirePermission(PermissionId.IMPORT_CSV_DATA), importAssetsHandler);
importRouter.post("/preview", requirePermission(PermissionId.IMPORT_CSV_DATA), previewImportHandler);