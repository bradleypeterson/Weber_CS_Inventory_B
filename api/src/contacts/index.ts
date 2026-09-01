import { type Request, type Response, Router } from "express";
import { getContactDetails } from "../db/procedures/contacts";
import { addContact } from "./add";
import { archiveContacts } from "./archive";
import { listContacts } from "./list";
import { updateContact } from "./update";
export const contactRouter = Router();

contactRouter.get("/list", listContacts);
contactRouter.post("/archive", archiveContacts);
contactRouter.post("/:id/update", updateContact);
contactRouter.post("/add", addContact);
contactRouter.get("/:id", async (req: Request, res: Response) => {
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
});
