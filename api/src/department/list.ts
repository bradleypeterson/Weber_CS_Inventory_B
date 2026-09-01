import type { Request, Response } from "express";
import { getAllDepartments } from "../db/procedures/departments";

export async function listDepartments(req: Request, res: Response) {
  try {
    const rows = await getAllDepartments();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listDepartments endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all departments" } });
  }
}
