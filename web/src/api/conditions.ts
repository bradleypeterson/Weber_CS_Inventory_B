import { JSONSchemaType } from "ajv";
import type { Condition } from "../../../@types/data";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";

export async function getAllConditions() {
  const response = await get("/conditions/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function addCondition(condition: Omit<Condition, "ConditionID">) {
  const response = await post("/conditions/add", condition, validateEmptyResponse);
  return response.status === "success";
}

export async function updateCondition(condition: Condition) {
  const response = await post(`/conditions/${condition.ConditionID}/update`, condition, validateEmptyResponse);
  return response.status === "success";
}

export async function deleteCondition(conditionId: number) {
  const response = await post(`/conditions/${conditionId}/delete`, {}, validateEmptyResponse);
  return response.status === "success";
}

export async function restoreCondition(conditionId: number) {
  const response = await post(`/conditions/${conditionId}/restore`, {}, validateEmptyResponse);
  return response.status === "success";
}

const validateResponseSchema: JSONSchemaType<Condition[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      ConditionID: { type: "number" },
      ConditionName: { type: "string" },
      ConditionAbbreviation: { type: "string" },
      Deleted: { type: "number", nullable: true }
    },
    required: ["ConditionID", "ConditionName", "ConditionAbbreviation"]
  }
};

const validateResponse = ajv.compile(validateResponseSchema);