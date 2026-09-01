import sha256 from "crypto-js/sha256";
import { User, UserOverview } from "../../../@types/data";
import { userOverviewArraySchema, userSchema } from "../../../@types/schemas";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";


export async function fetchUserList(): Promise<UserOverview[] | undefined> {
  const response = await get("/users/list", ajv.compile(userOverviewArraySchema));
  if (response.status === "success") return response.data as UserOverview[];
  return undefined;
}

export async function fetchUserDetails(personID: number): Promise<User | undefined> {
  const response = await get(`/users/${personID}`, ajv.compile(userSchema));
  if (response.status === "success") return response.data as User;
  return undefined;
}

export async function updateUserDetails(
  personID: number,
  updates: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  const response = await post(`/users/${personID}/update`, updates, validateEmptyResponse);
  return response;
}

export async function addUserDetails(
  newSalt: string,
  details: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
  ) {
  const hashDigest = sha256(details.password1 + newSalt);
  const hashedNewPassword = hashDigest.toString();
  details.hashedNewPassword = hashedNewPassword as string;
  details.Salt = newSalt as string;
  const response = await post(`/users/add`, details, validateEmptyResponse);
  return response;
}

export async function promoteContactUserDetails(
  personID: number,
  newSalt: string,
  details: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  const hashDigest = sha256(details.password1 + newSalt);
  const hashedNewPassword = hashDigest.toString();
  const payload = {
    ...details,
    personID,
    hashedNewPassword,
    Salt: newSalt
  };
  const response = await post(`/users/promote`, payload, validateEmptyResponse);
  return response;
}

export async function archiveUsers(personIds: number[]) {
  const response = await post(`/users/archive`, { personIds }, validateEmptyResponse);
  return response;
}
