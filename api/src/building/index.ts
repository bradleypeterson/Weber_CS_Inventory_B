import { Router } from "express";
import { addBuildingHandler } from "./add";
import { deleteBuildingHandler } from "./delete";
import { listBuildings } from "./list";
import { restoreBuildingHandler } from "./restore";
import { updateBuildingHandler } from "./update";
export const buildingRouter = Router();

buildingRouter.get("/list", listBuildings);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
buildingRouter.post("/add", addBuildingHandler);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
buildingRouter.post("/:id/update", updateBuildingHandler);
buildingRouter.post("/:id/delete", deleteBuildingHandler);
buildingRouter.post("/:id/restore", restoreBuildingHandler);
