import type { Request, Response } from "express";
import type { Condition } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { addCondition } from "../db/procedures/conditions";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { CONDITION_ENTITY_TYPE, formatConditionCreatedNote } from "./conditionSystemNotes";

const conditionSchema = {
  type: "object",
  properties: {
    ConditionName: { type: "string" },
    ConditionAbbreviation: { type: "string" }
  },
  required: ["ConditionName", "ConditionAbbreviation"],
  additionalProperties: false
};

const validateCondition = ajv.compile<Omit<Condition, "ConditionID">>(conditionSchema);

export async function addConditionHandler(req: Request, res: Response) {
  try {
    const condition: unknown = req.body;

    if (!validateCondition(condition)) {
      return res.status(400).json({
        status: "error",
        error: { message: "Invalid condition data", details: validateCondition.errors }
      });
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      return res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    }

    const conditionId = await addCondition(condition);
    try {
      await logSystemNote({
        entityType: CONDITION_ENTITY_TYPE,
        entityID: conditionId,
        note: formatConditionCreatedNote(
          conditionId,
          condition.ConditionName,
          condition.ConditionAbbreviation
        ),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for condition create:", logError);
    }
    return res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in addCondition endpoint:", error);
    return res.status(500).json({
      status: "error",
      error: { message: "Could not add condition" }
    });
  }
}