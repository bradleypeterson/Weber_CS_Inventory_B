import type { Request, Response } from "express";
import type { Department } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { getDepartmentById, updateDepartment } from "../db/procedures/departments";
import { logSystemNote } from "../systemNotes/logSystemNote";
import {
  DEPARTMENT_ENTITY_TYPE,
  formatDepartmentUpdateNote,
  hasDepartmentFieldChanges
} from "./departmentSystemNotes";

export async function updateDepartmentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const department = req.body as Partial<Department>;

    if (!id || isNaN(Number(id)) || !validateDepartment(department)) {
      res.status(400).json({ status: "error", error: { message: "Invalid department data" } });
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

    // Ensure the ID in the URL matches the object
    department.DepartmentID = departmentID;

    const updates = { Name: department.Name as string, Abbreviation: department.Abbreviation as string };

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    await updateDepartment(department as Department);

    if (hasDepartmentFieldChanges(existing, updates)) {
      try {
        await logSystemNote({
          entityType: DEPARTMENT_ENTITY_TYPE,
          entityID: departmentID,
          note: formatDepartmentUpdateNote(departmentID, existing, updates),
          performedBy: user.UserID,
          action: "Updated"
        });
      } catch (logError) {
        console.error("Failed to write system note for department update:", logError);
      }
    }

    res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in updateDepartment endpoint:", error);
    res.status(500).json({ status: "error", error: { message: "Could not update department" } });
  }
}

const departmentSchema = {
  type: "object",
  properties: {
    Name: { type: "string" },
    Abbreviation: { type: "string" },
    DepartmentID: { type: "number" }
  },
  required: ["Name", "Abbreviation"]
};

const validateDepartment = ajv.compile(departmentSchema);
