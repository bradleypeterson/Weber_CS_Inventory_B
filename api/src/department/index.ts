import { Router } from "express";
import { addDepartmentHandler } from "./add";
import { deleteDepartmentHandler } from "./delete";
import { listDepartments } from "./list";
import { restoreDepartmentHandler } from "./restore";
import { updateDepartmentHandler } from "./update";

export const departmentRouter = Router();

departmentRouter.get("/list", listDepartments);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
departmentRouter.post("/add", addDepartmentHandler);
departmentRouter.post("/:id/update", updateDepartmentHandler);
departmentRouter.post("/:id/delete", deleteDepartmentHandler);

departmentRouter.post("/:id/restore", restoreDepartmentHandler);
