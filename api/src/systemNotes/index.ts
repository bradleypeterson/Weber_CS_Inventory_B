import { Router } from "express";
import { createSystemNoteHandler, listSystemNoteEntityTypesHandler, listSystemNotesHandler } from "../systemNotes/notes";

export const systemNotesRouter = Router();

systemNotesRouter.get("/", listSystemNotesHandler);
systemNotesRouter.get("/entity-types", listSystemNoteEntityTypesHandler);
systemNotesRouter.post("/", createSystemNoteHandler);

