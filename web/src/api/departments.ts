import { JSONSchemaType } from "ajv";
import type { Department } from "../../../@types/data";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";

export async function fetchDepartments() {
  const response = await get("/departments/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function getAllDepartments() {
  const response = await get("/departments/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function addDepartment(department: Omit<Department, "DepartmentID">) {
  const response = await post("/departments/add", department, validateEmptyResponse);
  return response.status === "success";
}

export async function updateDepartment(department: Department) {
  const response = await post(`/departments/${department.DepartmentID}/update`, department, validateEmptyResponse);
  return response.status === "success";
}

export async function deleteDepartment(departmentId: number) {
  const response = await post(`/departments/${departmentId}/delete`, {}, validateEmptyResponse);
  return response.status === "success";
}

export async function restoreDepartment(departmentId: number) {
  const response = await post(`/departments/${departmentId}/restore`, {}, validateEmptyResponse);
  return response.status === "success";
}

const validateResponseSchema: JSONSchemaType<Department[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      DepartmentID: { type: "number" },
      Name: { type: "string" },
      Abbreviation: { type: "string" },
      Deleted: { type: "number", nullable: true }
    },
    required: ["Name", "DepartmentID", "Abbreviation"]
  }
};

const validateResponse = ajv.compile(validateResponseSchema);
