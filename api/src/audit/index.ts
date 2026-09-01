import { RequestHandler, Router } from "express";
import { getEquipmentForRoom } from "./equipment";
import { getAuditDetails, getAuditHistory, getAuditNotes } from "./history";
import { initiateAudit } from "./initiate";
import { scanItem } from "./scan-item";
import { submitAudit } from "./submit";
import { updateAuditNotes } from "./update-notes";

export const auditRouter = Router();

// Define routes with proper typing
auditRouter.post("/initiate", initiateAudit as RequestHandler);
auditRouter.get("/equipment/:roomId", getEquipmentForRoom as RequestHandler);
auditRouter.post("/scan-item", scanItem as RequestHandler);
auditRouter.post("/submit", submitAudit as RequestHandler);
auditRouter.post("/update-notes/:id", updateAuditNotes as RequestHandler);
auditRouter.get("/history", getAuditHistory as RequestHandler);
auditRouter.get("/history/:id", getAuditDetails as RequestHandler);
auditRouter.get("/notes/:id", getAuditNotes as RequestHandler);