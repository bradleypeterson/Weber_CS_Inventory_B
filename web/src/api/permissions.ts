import { JSONSchemaType } from "ajv";
import type { Permission } from "../../../@types/data"; //create this
import { ajv } from "../ajv";
import { get } from "./helpers";

export async function fetchPermissions() {
  const response = await get("/permissions/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

const validateResponseSchema: JSONSchemaType<Permission[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      PermissionID: { type: "number" },
      Name: { type: "string" },
    },
    required: ["Name", "PermissionID"]
  }
};

const validateResponse = ajv.compile(validateResponseSchema);