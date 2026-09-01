import { ADMIN_ADJACENT_PERMISSION_IDS, hasAnyPermission } from "../../../@types/permissions";
import { getDepartmentIDsByPersonID } from "../db/procedures/users";
import { validateUser } from "./validateToken";

export type AssetAccessScope = {
  userId: number;
  personId: number;
  permissions: number[];
  isAdmin: boolean;
  departmentIds: number[];
};

export async function getAssetAccessScope(user: unknown): Promise<AssetAccessScope | null> {
  if (!validateUser(user)) return null;

  const permissions = user.Permissions;
  const isAdmin = hasAnyPermission(permissions, ADMIN_ADJACENT_PERMISSION_IDS);
  const departmentIds = isAdmin ? [] : await getDepartmentIDsByPersonID(user.PersonID);

  return {
    userId: user.UserID,
    personId: user.PersonID,
    permissions,
    isAdmin,
    departmentIds
  };
}

export function canAccessAssetDepartment(scope: AssetAccessScope, departmentId?: number | null) {
  if (scope.isAdmin) return true;
  if (departmentId === null || departmentId === undefined) return false;
  return scope.departmentIds.includes(departmentId);
}
