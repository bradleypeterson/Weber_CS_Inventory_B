import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { canAccessAssetDepartment, getAssetAccessScope } from "../auth/assetScope";
import { validateUser } from "../auth/validateToken";
import { archiveAssetsProcedure, getAssetDetailsByIds } from "../db/procedures/assets";

export async function archiveAssets(req: Request, res: Response) {
  const params: unknown = req.body;
  const user: unknown = res.locals.user;
  if (!validateParams(params)) {
    res.status(400).json({ status: "error", error: { message: "Invalid request params" } });
    return;
  }

  if (!validateUser(user)) {
    res.status(401).json({ status: "error", error: { message: "Unknown User" } });
    return;
  }

  try {
    const scope = await getAssetAccessScope(user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "Unknown User" } });
      return;
    }

    const assets = await getAssetDetailsByIds(params.assetIds);
    if (assets.length !== params.assetIds.length) {
      res.status(404).json({ status: "error", error: { message: "One or more assets do not exist" } });
      return;
    }

    const unauthorizedAsset = assets.find((asset) => !canAccessAssetDepartment(scope, asset.DepartmentID));
    if (unauthorizedAsset !== undefined) {
      res.status(403).json({ status: "error", error: { message: "One or more assets are outside your department scope" } });
      return;
    }

    await archiveAssetsProcedure(user.UserID, params.assetIds);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error(`Error archiveAssets endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not archive assets" } });
  }
}

type Params = {
  assetIds: number[];
};

const paramsSchema: JSONSchemaType<Params> = {
  type: "object",
  properties: {
    assetIds: {
      type: "array",
      items: {
        type: "number"
      }
    }
  },
  required: ["assetIds"]
};

const validateParams = ajv.compile(paramsSchema);
