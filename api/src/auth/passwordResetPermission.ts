import { PermissionId, hasPermission } from "../../../@types/permissions";
import { validateUser } from "./validateToken";

export const RESET_USER_PASSWORD_PERMISSION_ID = PermissionId.ADD_EDIT_VIEW_USERS;

export function canResetUserPasswords(user: unknown): boolean {
  return validateUser(user) && hasPermission(user.Permissions, RESET_USER_PASSWORD_PERMISSION_ID);
}
