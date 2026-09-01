import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { restoreDepartment } from "../db/procedures/departments";

export async function restoreDepartmentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ status: "error", error: { message: "Invalid department id" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    await restoreDepartment(Number(id), user.UserID);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in restoreDepartment endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not restore department" } });
  }
}
