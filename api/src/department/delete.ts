import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { deleteDepartment, getDepartmentById } from "../db/procedures/departments";

export async function deleteDepartmentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ status: "error", error: { message: "Invalid department ID" } });
      return;
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      res.status(401).json({ status: "error", error: { message: "Unknown user" } });
      return;
    }

    const departmentID = Number(id);
    const existing = await getDepartmentById(departmentID);
    if (existing === undefined) {
      res.status(404).json({ status: "error", error: { message: "Department does not exist" } });
      return;
    }

    await deleteDepartment(departmentID, user.UserID, existing);
    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in deleteDepartment endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not delete department" } });
  }
}
