import { RequestHandler, Router } from "express";
import { getEquipmentForRoom } from "./equipment";
import { getAuditDetails, getAuditHistory, getAuditNotes } from "./history";
import { initiateAudit } from "./initiate";
import { scanItem } from "./scan-item";
import { submitAudit } from "./submit";
import { updateAuditNotes } from "./update-notes";

import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";

export const auditRouter = Router();

const canManageAudits = requirePermission(PermissionId.ADD_EDIT_ASSETS);

// Define routes with proper typing
auditRouter.post("/initiate", canManageAudits, initiateAudit as RequestHandler);
auditRouter.get("/equipment/:roomId", canManageAudits, getEquipmentForRoom as RequestHandler);
auditRouter.post("/scan-item", canManageAudits, scanItem as RequestHandler);
auditRouter.post("/submit", canManageAudits, submitAudit as RequestHandler);
auditRouter.post("/update-notes/:id", canManageAudits, updateAuditNotes as RequestHandler);
auditRouter.get("/history", canManageAudits, getAuditHistory as RequestHandler);
auditRouter.get("/history/:id", canManageAudits, getAuditDetails as RequestHandler);
auditRouter.get("/notes/:id", canManageAudits, getAuditNotes as RequestHandler);