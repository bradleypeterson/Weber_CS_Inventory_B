import { JSONSchemaType } from "ajv";
import type { DeviceType } from "../../../@types/data";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";

export async function getAllDeviceTypes() {
  const response = await get("/device-types/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function addDeviceType(deviceType: Omit<DeviceType, "DeviceTypeID">) {
  const response = await post("/device-types/add", deviceType, validateEmptyResponse);
  return response.status === "success";
}

export async function updateDeviceType(deviceType: DeviceType) {
  const response = await post(`/device-types/${deviceType.DeviceTypeID}/update`, deviceType, validateEmptyResponse);
  return response.status === "success";
}

export async function deleteDeviceType(deviceTypeId: number) {
  const response = await post(`/device-types/${deviceTypeId}/delete`, {}, validateEmptyResponse);
  return response.status === "success";
}

export async function restoreDeviceType(deviceTypeId: number) {
  const response = await post(`/device-types/${deviceTypeId}/restore`, {}, validateEmptyResponse);
  return response.status === "success";
}

const validateResponseSchema: JSONSchemaType<DeviceType[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      DeviceTypeID: { type: "number" },
      Name: { type: "string" },
      Abbreviation: { type: "string" },
      Deleted: { type: "number", nullable: true }
    },
    required: ["DeviceTypeID", "Name", "Abbreviation"]
  }
};

const validateResponse = ajv.compile(validateResponseSchema);