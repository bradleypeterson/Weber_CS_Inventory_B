import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { deleteCondition, getConditionById } from "../db/procedures/conditions";

export async function deleteConditionHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ status: "error", error: { message: "Invalid condition ID" } });
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

    await deleteCondition(conditionID, user.UserID, existing);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in deleteCondition endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not delete condition" } });
  }
}