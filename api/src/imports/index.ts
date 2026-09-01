import { Router } from "express";
import { importAssetsHandler, previewImportHandler } from "./import";
export const importRouter = Router();

importRouter.post("/", importAssetsHandler);
importRouter.post("/preview", previewImportHandler);