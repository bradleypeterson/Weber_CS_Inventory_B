import type { Request, Response } from "express";
import { hasPermission, PermissionId } from "../../../@types/permissions";
import { canAccessAssetDepartment, getAssetAccessScope } from "../auth/assetScope";
import { validateUser } from "../auth/validateToken";
import { normalizeDateForDB } from "../date";
import { createApprovalRequest } from "../db/procedures/approvalRequests";
import { addAsset } from "../db/procedures/assets";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { EQUIPMENT_ENTITY_TYPE, formatEquipmentCreatedNote } from "./equipmentSystemNotes";
import { validateAddAssetRequest } from "./schemas";

export async function addAssetHandler(req: Request, res: Response) {
  try {
    const params: unknown = req.body;
    if (validateAddAssetRequest(params) === false) {
      console.error(validateAddAssetRequest.errors);
      res.status(400).json({ status: "error", error: { message: "invalid equipment information" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    if (!canAccessAssetDepartment(scope, params.DepartmentID)) {
      res.status(403).json({ status: "error", error: { message: "Cannot add assets outside your department scope" } });
      return;
    }

    const { BuildingID: _buildingId, ...addAssetParams } = params;

    try {
      addAssetParams.AccountingDate = normalizeDateForDB(addAssetParams.AccountingDate);
    } catch {
      res.status(400).json({ status: "error", error: { message: "invalid date format" } });
      return;
    }

    // Check if the user can submit an asset without being approved
    const approvalRequired = !hasPermission(
      scope.permissions,
      PermissionId.APPROVE_ASSET_REQUESTS
    );

    if (approvalRequired) {
      await createApprovalRequest({
        requestType: "asset_add",
        payload: addAssetParams,
        requestedBy: user.UserID
      });

      res.json({
        status: "success",
        data: { approvalRequired: true }
      });
      return;
    }

    const result = await addAsset(addAssetParams);
    try {
      await logSystemNote({
        entityType: EQUIPMENT_ENTITY_TYPE,
        entityID: result.insertId,
        note: formatEquipmentCreatedNote(result.insertId, addAssetParams),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for equipment create:", logError);
    }
    res.json({ status: "success", data: { approvalRequired: false } });
  } catch (e) {
    res.status(500).json({ status: "error", error: { message: "An error occurred while adding an asset" } });
  }
}
