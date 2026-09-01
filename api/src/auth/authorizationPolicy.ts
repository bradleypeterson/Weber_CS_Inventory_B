import {
  ADMIN_ADJACENT_PERMISSION_IDS,
  PermissionCapability,
  PermissionId,
  permissionPolicyCatalog,
  type PermissionCapabilityKey,
  type PermissionIdValue,
} from "../../../@types/permissions";

type BackendRoutePolicy = {
  method: "GET" | "POST";
  route: string;
  capability: PermissionCapabilityKey;
  currentRule: "auth-only" | "permission-check" | "mixed";
  permissionIds: readonly PermissionIdValue[];
  notes?: string;
};

export const backendRoutePolicyRegistry: readonly BackendRoutePolicy[] = [
  {
    method: "POST",
    route: "/imports",
    capability: PermissionCapability.CSV_IMPORT,
    currentRule: "permission-check",
    permissionIds: ADMIN_ADJACENT_PERMISSION_IDS,
    notes: "Import endpoints currently allow admin-adjacent permissions (3-7) via asset scope."
  },
  {
    method: "POST",
    route: "/users/add|/users/:id/update|/users/archive|/users/promote",
    capability: PermissionCapability.USER_MANAGEMENT,
    currentRule: "auth-only",
    permissionIds: [PermissionId.ADD_EDIT_VIEW_USERS],
    notes: "User routes remain behavior-preserving in phase 1; no route-level tightening yet."
  },
  {
    method: "POST",
    route: "/contacts/add|/contacts/:id/update|/contacts/archive",
    capability: PermissionCapability.CONTACT_MANAGEMENT,
    currentRule: "auth-only",
    permissionIds: [PermissionId.ADD_EDIT_CONTACT_PERSONS],
  },
  {
    method: "POST",
    route: "/buildings|/rooms|/conditions|/device-types|/asset-classes (add/update/delete)",
    capability: PermissionCapability.LIST_OPTION_MANAGEMENT,
    currentRule: "auth-only",
    permissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
  },
  {
    method: "POST",
    route: "/audits/initiate|/audits/scan-item|/audits/submit|/audits/update-notes/:id",
    capability: PermissionCapability.AUDIT_WORKFLOW,
    currentRule: "auth-only",
    permissionIds: [PermissionId.ADD_EDIT_ASSETS],
  },
  {
    method: "GET",
    route: "/audits/history|/audits/history/:id|/audits/notes/:id",
    capability: PermissionCapability.AUDIT_WORKFLOW,
    currentRule: "auth-only",
    permissionIds: [PermissionId.ADD_EDIT_ASSETS],
  },
  {
    method: "POST",
    route: "/system-notes",
    capability: PermissionCapability.SYSTEM_NOTES_MANAGEMENT,
    currentRule: "mixed",
    permissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
    notes: "Create validates authenticated user; list routes are currently auth-only."
  },
  {
    method: "POST",
    route: "/auth/updatePassword (admin updateType path)",
    capability: PermissionCapability.USER_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_VIEW_USERS],
    notes: "Admin password reset check remains permission 6 in phase 1."
  }
];

export const sharedPermissionPolicyCatalog = permissionPolicyCatalog;
