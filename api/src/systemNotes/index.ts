import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { createSystemNoteHandler, listSystemNoteEntityTypesHandler, listSystemNotesHandler } from "../systemNotes/notes";

export const systemNotesRouter = Router();

const canManageListOptions = requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS);

systemNotesRouter.get("/", canManageListOptions, listSystemNotesHandler);
systemNotesRouter.get("/entity-types", canManageListOptions, listSystemNoteEntityTypesHandler);
systemNotesRouter.post("/", canManageListOptions, createSystemNoteHandler);