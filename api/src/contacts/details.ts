import { type Request, type Response } from "express";
import { getContactDetails } from "../db/procedures/contacts";

export async function contactDetails(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const contact = await getContactDetails(Number(id));
    if (contact === undefined) {
      res.status(404).json({ status: "error", error: { message: "Contact does not exist" } });
      return;
    }
    res.json({ status: "success", data: contact });
  } catch (error) {
    console.error(`Error in getContactDetails endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not get contact details" } });
  }
}