import { Router } from "express";
import { listPermissions } from "./list";
export const permissionsRouter = Router();

permissionsRouter.get("/list", listPermissions);