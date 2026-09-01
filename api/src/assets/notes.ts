import { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { canAccessAssetDepartment, getAssetAccessScope } from "../auth/assetScope";
import { validateUser } from "../auth/validateToken";
import { addAssetNote, getAssetDetails, getAssetNotes } from "../db/procedures/assets";

export async function assetNotesHanlder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const scope = await getAssetAccessScope(res.locals.user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "invalid user" } });
      return;
    }

    const asset = await getAssetDetails(Number(id));
    if (asset === undefined) {
      res.status(404).json({ status: "error", error: { message: "asset not found" } });
      return;
    }
    if (!canAccessAssetDepartment(scope, asset.DepartmentID)) {
      res.status(403).json({ status: "error", error: { message: "asset outside your department scope" } });
      return;
    }

    const notes = await getAssetNotes(Number(id));
    res.json({ status: "success", data: notes });
  } catch (e) {
    res.status(500).json({ status: "error", error: { message: "An error occurred while fetching asset notes" } });
  }
}

export async function addNewAssetNoteHandler(req: Request, res: Response) {
  const params: unknown = req.body;
  if (validateNewNoteParams(params) === false) {
    res.status(400).json({ status: "error", error: { message: "invalid request body" } });
    return;
  }
  const user: unknown = res.locals.user;
  if (validateUser(user) === false) {
    res.status(401).json({ status: "error", error: { message: "invalid user" } });
    return;
  }

  try {
    const { id } = req.params;
    const scope = await getAssetAccessScope(user);
    if (scope === null) {
      res.status(401).json({ status: "error", error: { message: "invalid user" } });
      return;
    }

    const asset = await getAssetDetails(Number(id));
    if (asset === undefined) {
      res.status(404).json({ status: "error", error: { message: "asset not found" } });
      return;
    }
    if (!canAccessAssetDepartment(scope, asset.DepartmentID)) {
      res.status(403).json({ status: "error", error: { message: "asset outside your department scope" } });
      return;
    }

    await addAssetNote(user.UserID, Number(id), params.note);
    res.json({ status: "success", data: {} });
  } catch (e) {
    res.status(500).json({ status: "error", error: { message: "An error occurred while adding note" } });
  }
}

type AddNewNoteParams = {
  note: string;
};
const newNoteParamsSchema: JSONSchemaType<AddNewNoteParams> = {
  type: "object",
  properties: {
    note: { type: "string" }
  },
  required: ["note"]
};
const validateNewNoteParams = ajv.compile(newNoteParamsSchema);
