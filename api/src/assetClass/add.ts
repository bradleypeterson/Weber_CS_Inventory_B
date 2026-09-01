import type { Request, Response } from "express";
import type { AssetClass } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { addAssetClass } from "../db/procedures/assetClass";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { ASSET_CLASS_ENTITY_TYPE, formatAssetClassCreatedNote } from "./assetClassSystemNotes";

const assetClassSchema = {
  type: "object",
  properties: {
    Name: { type: "string" },
    Abbreviation: { type: "string" }
  },
  required: ["Name", "Abbreviation"],
  additionalProperties: false
};

const validateAssetClass = ajv.compile<Omit<AssetClass, "AssetClassID">>(assetClassSchema);

export async function addAssetClassHandler(req: Request, res: Response) {
  try {
    const assetClass: unknown = req.body;

    if (!validateAssetClass(assetClass)) {
      return res.status(400).json({
        status: "error",
        error: { message: "Invalid asset class data", details: validateAssetClass.errors }
      });
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      return res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    }

    const assetClassId = await addAssetClass(assetClass);
    try {
      await logSystemNote({
        entityType: ASSET_CLASS_ENTITY_TYPE,
        entityID: assetClassId,
        note: formatAssetClassCreatedNote(assetClassId, assetClass.Name, assetClass.Abbreviation),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for asset class create:", logError);
    }
    return res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in addAssetClass endpoint:", error);
    return res.status(500).json({
      status: "error",
      error: { message: "Could not add asset class" }
    });
  }
}
