import { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { addSystemNote, getSystemNoteEntityTypes, getSystemNotes } from "../db/procedures/systemNotes";

type CreateSystemNoteParams = {
  EntityType: string;
  EntityID: number;
  Note: string;
  Action?: string | null;
};

const createSystemNoteSchema: JSONSchemaType<CreateSystemNoteParams> = {
  type: "object",
  properties: {
    EntityType: { type: "string" },
    EntityID: { type: "number" },
    Note: { type: "string" },
    Action: { type: "string", nullable: true }
  },
  required: ["EntityType", "EntityID", "Note"],
  additionalProperties: false
};

const validateCreateSystemNote = ajv.compile(createSystemNoteSchema);

export async function createSystemNoteHandler(req: Request, res: Response) {
  const body: unknown = req.body;
  if (validateCreateSystemNote(body) === false) {
    res.status(400).json({
      status: "error",
      error: { message: "invalid request body", details: validateCreateSystemNote.errors }
    });
    return;
  }

  const user: unknown = res.locals.user;
  if (validateUser(user) === false) {
    res.status(401).json({ status: "error", error: { message: "invalid user" } });
    return;
  }

  const entityType = body.EntityType.trim();
  const note = body.Note.trim();
  if (entityType === "") {
    res.status(400).json({ status: "error", error: { message: "EntityType cannot be blank" } });
    return;
  }
  if (note === "") {
    res.status(400).json({ status: "error", error: { message: "Note cannot be blank" } });
    return;
  }

  const action =
    typeof body.Action === "string" && body.Action.trim() !== "" ? body.Action.trim().slice(0, 32) : null;

  try {
    await addSystemNote(entityType, body.EntityID, note, user.UserID, action);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in createSystemNoteHandler:", error);
    res.status(500).json({ status: "error", error: { message: "Could not create system note" } });
  }
}

export async function listSystemNotesHandler(req: Request, res: Response) {
  const entityTypesRaw = req.query.entityTypes;
  const entityIdRaw = req.query.entityId;
  const performedByRaw = req.query.performedBy;
  const startDateRaw = req.query.startDate;
  const endDateRaw = req.query.endDate;
  const pageRaw = req.query.page;
  const pageSizeRaw = req.query.pageSize;
  const allRaw = req.query.all;

  const filters: {
    entityTypes?: string[];
    entityId?: number;
    performedBy?: number;
    startDate?: string;
    endDate?: string;
  } = {};
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const allowAll = allRaw === "1" || allRaw === "true";
  const pageSizeOptions = new Set([10, 25, 50, 100]);
  let page = 1;
  let pageSize = 10;

  if (typeof entityTypesRaw === "string" && entityTypesRaw.trim() !== "") {
    const entityTypes = entityTypesRaw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (entityTypes.length > 0) {
      filters.entityTypes = [...new Set(entityTypes)];
    }
  }
  if (typeof entityIdRaw === "string" && entityIdRaw.trim() !== "") {
    const parsed = Number(entityIdRaw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      res.status(400).json({ status: "error", error: { message: "entityId must be a positive integer" } });
      return;
    }
    filters.entityId = parsed;
  }
  if (typeof performedByRaw === "string" && performedByRaw.trim() !== "") {
    const parsed = Number(performedByRaw);
    if (Number.isNaN(parsed)) {
      res.status(400).json({ status: "error", error: { message: "query param performedBy must be a number" } });
      return;
    }
    filters.performedBy = parsed;
  }
  if (typeof startDateRaw === "string" && startDateRaw.trim() !== "") {
    if (!datePattern.test(startDateRaw)) {
      res.status(400).json({ status: "error", error: { message: "startDate must be YYYY-MM-DD" } });
      return;
    }
    filters.startDate = startDateRaw;
  }
  if (typeof endDateRaw === "string" && endDateRaw.trim() !== "") {
    if (!datePattern.test(endDateRaw)) {
      res.status(400).json({ status: "error", error: { message: "endDate must be YYYY-MM-DD" } });
      return;
    }
    filters.endDate = endDateRaw;
  }
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    res.status(400).json({ status: "error", error: { message: "startDate cannot be after endDate" } });
    return;
  }
  if (!allowAll) {
    if (typeof pageRaw === "string" && pageRaw.trim() !== "") {
      const parsed = Number(pageRaw);
      if (!Number.isInteger(parsed) || parsed < 1) {
        res.status(400).json({ status: "error", error: { message: "page must be an integer >= 1" } });
        return;
      }
      page = parsed;
    }
    if (typeof pageSizeRaw === "string" && pageSizeRaw.trim() !== "") {
      const parsed = Number(pageSizeRaw);
      if (!Number.isInteger(parsed) || !pageSizeOptions.has(parsed)) {
        res
          .status(400)
          .json({ status: "error", error: { message: "pageSize must be one of 10, 25, 50, or 100" } });
        return;
      }
      pageSize = parsed;
    }
  }

  try {
    const result = await getSystemNotes(filters, allowAll ? undefined : { page, pageSize });
    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("Error in listSystemNotesHandler:", error);
    res.status(500).json({ status: "error", error: { message: "Could not fetch system notes" } });
  }
}

export async function listSystemNoteEntityTypesHandler(_req: Request, res: Response) {
  try {
    const dbTypes = await getSystemNoteEntityTypes();
    const knownTypes = [
      "Equipment",
      "User",
      "Contact",
      "Department",
      "AssetClass",
      "Condition",
      "DeviceType",
      "Building",
      "Room"
    ];
    const merged = [...new Set([...knownTypes, ...dbTypes])].sort((a, b) => a.localeCompare(b));
    res.json({ status: "success", data: merged });
  } catch (error) {
    console.error("Error in listSystemNoteEntityTypesHandler:", error);
    res.status(500).json({ status: "error", error: { message: "Could not fetch system note entity types" } });
  }
}

