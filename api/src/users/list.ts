import type { Request, Response } from "express";
import { getAllUsers } from "../db/procedures/users";

export async function listUsers(req: Request, res: Response) {
  try {
    const rows = await getAllUsers();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listUsers endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all users" } });
  }
}

