import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { addContact } from "./add";
import { archiveContacts } from "./archive";
import { contactDetails } from "./details";
import { listContacts } from "./list";
import { updateContact } from "./update";

export const contactRouter = Router();

const canManageContacts = requirePermission(PermissionId.ADD_EDIT_CONTACT_PERSONS);

contactRouter.get("/list", listContacts);
contactRouter.post("/archive", canManageContacts, archiveContacts);
contactRouter.post("/:id/update", canManageContacts, updateContact);
contactRouter.post("/add", canManageContacts, addContact);
contactRouter.get("/:id", contactDetails);