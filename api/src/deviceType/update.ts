import type { Request, Response } from "express";
import type { DeviceType } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { getDeviceTypeById, updateDeviceType } from "../db/procedures/deviceTypes";
import { logSystemNote } from "../systemNotes/logSystemNote";
import {
  DEVICE_TYPE_ENTITY_TYPE,
  formatDeviceTypeUpdateNote,
  hasDeviceTypeFieldChanges
} from "./deviceTypeSystemNotes";

export async function updateDeviceTypeHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const deviceType = req.body as Partial<DeviceType>;

    if (!id || isNaN(Number(id)) || !validateDeviceType(deviceType)) {
      return res.status(400).json({
        status: "error",
        error: { message: "Invalid device type data" }
      });
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      return res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    }

    const deviceTypeID = Number(id);
    const existing = await getDeviceTypeById(deviceTypeID);
    if (existing === undefined) {
      return res.status(404).json({ status: "error", error: { message: "Device type does not exist" } });
    }

    deviceType.DeviceTypeID = deviceTypeID;

    const updates = { Name: deviceType.Name as string, Abbreviation: deviceType.Abbreviation as string };

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    await updateDeviceType(deviceType as DeviceType);

    if (hasDeviceTypeFieldChanges(existing, updates)) {
      try {
        await logSystemNote({
          entityType: DEVICE_TYPE_ENTITY_TYPE,
          entityID: deviceTypeID,
          note: formatDeviceTypeUpdateNote(deviceTypeID, existing, updates),
          performedBy: user.UserID,
          action: "Updated"
        });
      } catch (logError) {
        console.error("Failed to write system note for device type update:", logError);
      }
    }

    return res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in updateDeviceType endpoint:", error);
    return res.status(500).json({
      status: "error",
      error: { message: "Could not update device type" }
    });
  }
}

const deviceTypeSchema = {
  type: "object",
  properties: {
    Name: { type: "string" },
    Abbreviation: { type: "string" },
    DeviceTypeID: { type: "number" }
  },
  required: ["Name", "Abbreviation"]
};

const validateDeviceType = ajv.compile(deviceTypeSchema);
