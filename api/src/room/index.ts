import { Router } from "express";
import { PermissionId } from "../../../@types/permissions";
import { requirePermission } from "../auth/requirePermission";
import { addRoomHandler } from "./add";
import { deleteRoomHandler } from "./delete";
import { listRooms } from "./list";
import { restoreRoomHandler } from "./restore";
import { updateRoomHandler } from "./update";

export const roomRouter = Router();

const canManageListOptions = requirePermission(PermissionId.ADD_EDIT_LIST_OPTIONS);

roomRouter.get("/list", listRooms);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
roomRouter.post("/add", canManageListOptions, addRoomHandler);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
roomRouter.post("/:id/update", canManageListOptions, updateRoomHandler);
roomRouter.post("/:id/delete", canManageListOptions, deleteRoomHandler);

roomRouter.post("/:id/restore", canManageListOptions, restoreRoomHandler);
