import type { Request, Response } from "express";
import type { Department } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { addDepartment } from "../db/procedures/departments";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { DEPARTMENT_ENTITY_TYPE, formatDepartmentCreatedNote } from "./departmentSystemNotes";

const departmentSchema = {
  type: "object",
  properties: {
    Name: { type: "string" },
    Abbreviation: { type: "string" }
  },
  required: ["Name", "Abbreviation"],
  additionalProperties: false
};

const validateDepartment = ajv.compile<Omit<Department, "DepartmentID">>(departmentSchema);

export async function addDepartmentHandler(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const department = req.body;

    if (!validateDepartment(department)) {
      return res.status(400).json({
        status: "error",
        error: { message: "Invalid department data", details: validateDepartment.errors }
      });
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      return res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    }

    const departmentId = await addDepartment(department);
    try {
      await logSystemNote({
        entityType: DEPARTMENT_ENTITY_TYPE,
        entityID: departmentId,
        note: formatDepartmentCreatedNote(departmentId, department.Name, department.Abbreviation),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for department create:", logError);
    }
    return res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in addDepartment endpoint:", error);
    return res.status(500).json({
      status: "error",
      error: { message: "Could not add department" }
    });
  }
}
