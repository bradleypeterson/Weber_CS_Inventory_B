import { JSONSchemaType } from "ajv";
import sha256 from "crypto-js/sha256";
import { ajv } from "../ajv";
import { clearPersistedFilters } from "../filters/storage";
import { get, post } from "./helpers";

export async function login(wNumber: string, password: string) {
  const userIdResponse = await get (`/auth/wNumber?wNumber=${wNumber}`, validateWNumberResponse);
  if (userIdResponse.status === "error") return userIdResponse;
  const userId = userIdResponse.data.userId;
  const saltResponse = await get(`/auth/salt?userId=${userId}`, validateSaltResponse);
  if (saltResponse.status === "error") return saltResponse;

  const hashDigest = sha256(password + saltResponse.data.salt);
  const hashedPassword = hashDigest.toString();
  const loginResponse = await post(`/auth/login`, { wNumber, password: hashedPassword }, validateLoginResponse);
  if (loginResponse.status === "error") return loginResponse;

  clearPersistedFilters();
  localStorage.setItem("token", loginResponse.data.token);
  localStorage.setItem("permissions", JSON.stringify(loginResponse.data.permissions));
  localStorage.setItem("personID", loginResponse.data.personID.toString());
  return loginResponse;
}

const saltResponseSchema: JSONSchemaType<{ salt: string }> = {
  type: "object",
  properties: {
    salt: { type: "string" }
  },
  required: ["salt"]
};

const validateSaltResponse = ajv.compile(saltResponseSchema);

const wNumberResponseSchema: JSONSchemaType<{ userId: string}> = {
  type: "object",
  properties: {
    userId: { type: "string" }
  },
  required: ["userId"]
};

const validateWNumberResponse = ajv.compile(wNumberResponseSchema);

const loginResponseSchema: JSONSchemaType<{ token: string; permissions: number[]; personID: number }> = {
  type: "object",
  properties: {
    token: { type: "string" },
    permissions: { type: "array", items: { type: "number" } },
    personID: { type: "number" }
  },
  required: ["token"]
};

const validateLoginResponse = ajv.compile(loginResponseSchema);

export async function updatePassword( userID: string, oldPassword: string, newPassword: string, newSalt: string, updateType: string) {
  const hashedNewPassword = sha256(newPassword + newSalt).toString();
  let hashedOldPassword = "";

  if (updateType === "personal") {
    // personal accounts provide current password
    const saltResponse = await get(`/auth/salt?userId=${userID}`, validateSaltResponse);
    if (saltResponse.status === "error") return saltResponse;
    hashedOldPassword = sha256(oldPassword + saltResponse.data.salt).toString();
  } 
  const passwordChangeResponse = await post("/auth/updatePassword", { userID, hashedOldPassword, hashedNewPassword, newSalt, updateType }, validatePasswordChangeResponse);
  console.log("Response: ", passwordChangeResponse);
  return passwordChangeResponse;
}

const passwordChangeResponseSchema: JSONSchemaType< {userID: string}>= {
  type: "object",
  properties: {
    userID: { type: "string" },
  },
  required: ["userID"],
};

const validatePasswordChangeResponse = ajv.compile(passwordChangeResponseSchema);
