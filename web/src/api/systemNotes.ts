import { ajv } from "../ajv";
import { get } from "./helpers";

export type SystemNote = {
  SystemNoteID: number;
  EntityType: string;
  EntityID: number;
  Action: string | null;
  Note: string;
  PerformedBy: number | null;
  PerformedByName: string;
  PerformedAt: string;
};

export type SystemNoteFilters = {
  entityTypes?: string[];
  /** Restrict to this EntityID (e.g. equipment id when entityTypes includes Equipment) */
  entityId?: number;
  performedBy?: number;
  startDate?: string;
  endDate?: string;
};

export type SystemNotesResult = {
  rows: SystemNote[];
  total: number;
};

export type SystemNotesQueryOptions = {
  page?: number;
  pageSize?: 10 | 25 | 50 | 100;
  all?: boolean;
};

const systemNoteSchema = {
  type: "object",
  properties: {
    SystemNoteID: { type: "number" },
    EntityType: { type: "string" },
    EntityID: { type: "number" },
    Action: { type: ["string", "null"] },
    Note: { type: "string" },
    PerformedBy: { type: ["number", "null"] },
    PerformedByName: { type: "string" },
    PerformedAt: { type: "string" }
  },
  required: ["SystemNoteID", "EntityType", "EntityID", "Action", "Note", "PerformedBy", "PerformedByName", "PerformedAt"],
  additionalProperties: false
};

const systemNotesResultSchema = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      items: systemNoteSchema
    },
    total: { type: "number" }
  },
  required: ["rows", "total"],
  additionalProperties: false
};

const validateSystemNotesResult = ajv.compile<SystemNotesResult>(systemNotesResultSchema);

export async function fetchSystemNotes(
  filters: SystemNoteFilters = {},
  options: SystemNotesQueryOptions = {}
): Promise<SystemNotesResult | undefined> {
  const params = new URLSearchParams();
  if (filters.entityTypes && filters.entityTypes.length > 0) params.set("entityTypes", filters.entityTypes.join(","));
  if (filters.entityId !== undefined) params.set("entityId", String(filters.entityId));
  if (filters.performedBy !== undefined) params.set("performedBy", String(filters.performedBy));
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (options.all) {
    params.set("all", "1");
  } else {
    if (options.page !== undefined) params.set("page", String(options.page));
    if (options.pageSize !== undefined) params.set("pageSize", String(options.pageSize));
  }
  const query = params.toString();

  const response = await get(`/system-notes${query ? `?${query}` : ""}`, validateSystemNotesResult);
  if (response.status === "success") return response.data;
  return undefined;
}

const entityTypeArraySchema = {
  type: "array",
  items: { type: "string" }
};

const validateEntityTypes = ajv.compile<string[]>(entityTypeArraySchema);

export async function fetchSystemNoteEntityTypes(): Promise<string[]> {
  const response = await get("/system-notes/entity-types", validateEntityTypes);
  if (response.status === "success") return response.data;
  return [];
}

