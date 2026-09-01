import { JSONSchemaType } from "ajv";
import type { Building } from "../../../@types/data";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";

export async function fetchBuildings() {
  const response = await get("/buildings/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function getAllBuildings() {
  const response = await get("/buildings/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function addBuilding(building: Omit<Building, "BuildingID">) {
  const response = await post("/buildings/add", building, validateEmptyResponse);
  return response.status === "success";
}

export async function updateBuilding(building: Building) {
  const response = await post(`/buildings/${building.BuildingID}/update`, building, validateEmptyResponse);
  return response.status === "success";
}

export async function deleteBuilding(buildingId: number) {
  const response = await post(`/buildings/${buildingId}/delete`, {}, validateEmptyResponse);
  return response.status === "success";
}

export async function restoreBuilding(buildingId: number) {
  const response = await post(`/buildings/${buildingId}/restore`, {}, validateEmptyResponse);
  return response.status === "success";
}

const validateResponseSchema: JSONSchemaType<Building[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      BuildingID: { type: "number" },
      Name: { type: "string" },
      Abbreviation: { type: "string" },
      Deleted: { type: "number", nullable: true }
    },
    required: ["Name", "BuildingID", "Abbreviation"]
  }
};

const validateResponse = ajv.compile(validateResponseSchema);
