import type { Request, Response } from "express";
import type { Condition } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { getConditionById, updateCondition } from "../db/procedures/conditions";
import { logSystemNote } from "../systemNotes/logSystemNote";
import {
  CONDITION_ENTITY_TYPE,
  formatConditionUpdateNote,
  hasConditionFieldChanges
} from "./conditionSystemNotes";

export async function updateConditionHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const condition = req.body as Partial<Condition>;

    if (!id || isNaN(Number(id)) || !validateCondition(condition)) {
      res.status(400).json({ status: "error", error: { message: "Invalid condition data" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const conditionID = Number(id);
    const existing = await getConditionById(conditionID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "Condition does not exist" } });
      return;
    }

    // Ensure the ID in the URL matches the object
    condition.ConditionID = conditionID;

    const updates = {
      ConditionName: condition.ConditionName as string,
      ConditionAbbreviation: condition.ConditionAbbreviation as string
    };

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    await updateCondition(condition as Condition);

    if (hasConditionFieldChanges(existing, updates)) {
      try {
        await logSystemNote({
          entityType: CONDITION_ENTITY_TYPE,
          entityID: conditionID,
          note: formatConditionUpdateNote(conditionID, existing, updates),
          performedBy: user.UserID,
          action: "Updated"
        });
      } catch (logError) {
        console.error("Failed to write system note for condition update:", logError);
      }
    }

    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in updateCondition endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not update condition" } });
  }
}

const conditionSchema = {
  type: "object",
  properties: {
    ConditionName: { type: "string" },
    ConditionAbbreviation: { type: "string" },
    ConditionID: { type: "number" }
  },
  required: ["ConditionName", "ConditionAbbreviation"]
};

const validateCondition = ajv.compile(conditionSchema);
