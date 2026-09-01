import type { Request, Response } from "express";
import { getAllContacts } from "../db/procedures/contacts";

export async function listContacts(req: Request, res: Response) {
  try {
    const rows = await getAllContacts();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listContacts endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all contacts" } });
  }
}
