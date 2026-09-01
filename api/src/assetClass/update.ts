import type { Request, Response } from "express";
import type { AssetClass } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { getAssetClassById, updateAssetClass } from "../db/procedures/assetClass";
import { logSystemNote } from "../systemNotes/logSystemNote";
import {
  ASSET_CLASS_ENTITY_TYPE,
  formatAssetClassUpdateNote,
  hasAssetClassFieldChanges
} from "./assetClassSystemNotes";

export async function updateAssetClassHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const assetClass = req.body as Partial<AssetClass>;

    if (!id || isNaN(Number(id)) || !validateAssetClass(assetClass)) {
      res.status(400).json({ status: "error", error: { message: "Invalid asset class data" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const assetClassID = Number(id);
    const existing = await getAssetClassById(assetClassID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "Asset class does not exist" } });
      return;
    }

    assetClass.AssetClassID = assetClassID;

    const updates = { Name: assetClass.Name as string, Abbreviation: assetClass.Abbreviation as string };

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    await updateAssetClass(assetClass as AssetClass);

    if (hasAssetClassFieldChanges(existing, updates)) {
      try {
        await logSystemNote({
          entityType: ASSET_CLASS_ENTITY_TYPE,
          entityID: assetClassID,
          note: formatAssetClassUpdateNote(assetClassID, existing, updates),
          performedBy: user.UserID,
          action: "Updated"
        });
      } catch (logError) {
        console.error("Failed to write system note for asset class update:", logError);
      }
    }

    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in updateAssetClass endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not update asset class" } });
  }
}

const assetClassSchema = {
  type: "object",
  properties: {
    Name: { type: "string" },
    Abbreviation: { type: "string" },
    AssetClassID: { type: "number" }
  },
  required: ["Name", "Abbreviation"]
};

const validateAssetClass = ajv.compile(assetClassSchema);
