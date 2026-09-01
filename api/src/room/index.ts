import { Router } from "express";
import { addRoomHandler } from "./add";
import { deleteRoomHandler } from "./delete";
import { listRooms } from "./list";
import { restoreRoomHandler } from "./restore";
import { updateRoomHandler } from "./update";
export const roomRouter = Router();

roomRouter.get("/list", listRooms);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
roomRouter.post("/add", addRoomHandler);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
roomRouter.post("/:id/update", updateRoomHandler);
roomRouter.post("/:id/delete", deleteRoomHandler);

roomRouter.post("/:id/restore", restoreRoomHandler);
