import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { canAccessAssetDepartment, getAssetAccessScope } from "../auth/assetScope";
import { validateUser } from "../auth/validateToken";
import { dbUpdateAsset, getAssetDetails } from "../db/procedures/assets";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { EQUIPMENT_ENTITY_TYPE, formatEquipmentUpdateNote } from "./equipmentSystemNotes";

export async function updateAsset(req: Request, res: Response) {
  try {
    const updates: unknown = req.body;
    const { id } = req.params;
    if (!validateUpdates(updates) || !id) {
      res.status(400).json({ status: "error", error: { message: "invalid updates" } });
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

    const existingAsset = await getAssetDetails(Number(id));
    if (existingAsset === undefined) {
      res.status(404).json({ status: "error", error: { message: "Asset does not exist" } });
      return;
    }

    if (!canAccessAssetDepartment(scope, existingAsset.DepartmentID)) {
      res.status(403).json({ status: "error", error: { message: "Cannot update assets outside your department scope" } });
      return;
    }

    if (typeof updates.DepartmentID === "number" && !canAccessAssetDepartment(scope, updates.DepartmentID)) {
      res.status(403).json({ status: "error", error: { message: "Cannot move assets outside your department scope" } });
      return;
    }

    await dbUpdateAsset(Number(id), updates);
    try {
      await logSystemNote({
        entityType: EQUIPMENT_ENTITY_TYPE,
        entityID: Number(id),
        note: formatEquipmentUpdateNote(existingAsset, updates),
        performedBy: user.UserID,
        action: "Updated"
      });
    } catch (logError) {
      console.error("Failed to write system note for equipment update:", logError);
    }
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in updateAsset endpoint", error);
    res.status(500).json({ status: "error", error: { message: "An error occurred while update asset." } });
  }
}

const updateSchema: JSONSchemaType<
  Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
> = {
  type: "object",
  properties: {
    EquipmentID: { type: "number" },
    TagNumber: { type: "string" },
    SerialNumber: { type: "string" },
    Description: { type: "string" },
    DepartmentID: { type: "number" },
    DepartmentName: { type: "string" },
    LocationID: { type: "number" },
    RoomNumber: { type: "string" },
    Barcode: { type: "string" },
    BuildingName: { type: "string" },
    BuildingAbbr: { type: "string" },
    ContactPersonID: { type: "number" },
    ContactPersonFirstName: { type: "string" },
    ContactPersonLastName: { type: "string" },
    AssetClassID: { type: "number" },
    AssetClassName: { type: "string" },
    FiscalYearID: { type: "number" },
    FiscalYear: { type: "string" },
    ConditionID: { type: "number" },
    ConditionName: { type: "string" },
    DeviceTypeID: { type: "number" },
    DeviceTypeName: { type: "string" },
    Manufacturer: { type: "string" },
    PartNumber: { type: "string" },
    Rapid7: { type: "number", enum: [1, 0] },
    CrowdStrike: { type: "number", enum: [1, 0] },
    ArchiveStatus: { type: "number", enum: [1, 0] },
    PONumber: { type: "string" },
    SecondaryNumber: { type: "string" },
    AccountingDate: { type: "string" },
    AccountCost: { type: "number" }
  },
  required: [],
  additionalProperties: true
};

const validateUpdates = ajv.compile(updateSchema);
