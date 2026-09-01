import type { Request, Response } from "express";
import type { DeviceType } from "../../../@types/data";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { addDeviceType } from "../db/procedures/deviceTypes";
import { logSystemNote } from "../systemNotes/logSystemNote";
import { DEVICE_TYPE_ENTITY_TYPE, formatDeviceTypeCreatedNote } from "./deviceTypeSystemNotes";

const deviceTypeSchema = {
  type: "object",
  properties: {
    Name: { type: "string" },
    Abbreviation: { type: "string" }
  },
  required: ["Name", "Abbreviation"],
  additionalProperties: false
};

const validateDeviceType = ajv.compile<Omit<DeviceType, "DeviceTypeID">>(deviceTypeSchema);

export async function addDeviceTypeHandler(req: Request, res: Response) {
  try {
    const deviceType: unknown = req.body;

    if (!validateDeviceType(deviceType)) {
      return res.status(400).json({
        status: "error",
        error: { message: "Invalid device type data", details: validateDeviceType.errors }
      });
    }

    const user: unknown = res.locals.user;
    if (!validateUser(user)) {
      return res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    }

    const deviceTypeId = await addDeviceType(deviceType);
    try {
      await logSystemNote({
        entityType: DEVICE_TYPE_ENTITY_TYPE,
        entityID: deviceTypeId,
        note: formatDeviceTypeCreatedNote(deviceTypeId, deviceType.Name, deviceType.Abbreviation),
        performedBy: user.UserID,
        action: "Created"
      });
    } catch (logError) {
      console.error("Failed to write system note for device type create:", logError);
    }
    return res.json({ status: "success", data: {} });
  } catch (error) {
    console.error("Error in addDeviceType endpoint:", error);
    return res.status(500).json({
      status: "error",
      error: { message: "Could not add device type" }
    });
  }
}
