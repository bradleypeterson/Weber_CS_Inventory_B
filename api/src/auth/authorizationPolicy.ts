import {
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
  currentRule: "public" | "auth-only" | "permission-check" | "mixed";
  // When multiple IDs are listed, each permission is required.
  permissionIds: readonly PermissionIdValue[];
  notes?: string;
};

export const backendRoutePolicyRegistry: readonly BackendRoutePolicy[] = [
  {
    method: "POST",
    route: "/imports|/imports/preview",
    capability: PermissionCapability.CSV_IMPORT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.IMPORT_CSV_DATA],
    notes: "Both routes require permission 3. The asset scope helper treats permissions 3-8 as global asset scope."
  },
  {
    method: "GET",
    route: "/users/list|/users/:id",
    capability: PermissionCapability.USER_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_VIEW_USERS],
  },
  {
    method: "POST",
    route: "/users/archive",
    capability: PermissionCapability.USER_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_VIEW_USERS],
  },
  {
    method: "POST",
    route: "/users/:id/update",
    capability: PermissionCapability.USER_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_VIEW_USERS],
    notes: "The route requires permission 6. The Permissions field is accepted by the handler but is not separately protected by permission 7."
  },
  {
    method: "POST",
    route: "/users/add|/users/promote",
    capability: PermissionCapability.USER_PERMISSION_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_VIEW_USERS, PermissionId.SET_USER_PERMISSIONS],
    notes: "Both routes require permissions 6 and 7."
  },
  {
    method: "POST",
    route: "/contacts/add|/contacts/:id/update|/contacts/archive",
    capability: PermissionCapability.CONTACT_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_CONTACT_PERSONS],
    notes: "add, update, and archive require permission 4.",
  },
  {
    method: "GET",
    route: "/contacts/list|/contacts/:id",
    capability: PermissionCapability.READ_ONLY_AUTHENTICATED,
    currentRule: "auth-only",
    permissionIds: [],
  },
  {
    method: "POST",
    route: "/buildings|/rooms|/conditions|/departments|/device-types|/asset-classes (add/update/delete/restore)",
    capability: PermissionCapability.LIST_OPTION_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
  },
  {
    method: "GET",
    route: "/buildings/list|/rooms/list|/conditions/list|/departments/list|/device-types/list|/asset-classes/list",
    capability: PermissionCapability.READ_ONLY_AUTHENTICATED,
    currentRule: "auth-only",
    permissionIds: [],
  },
  {
    method: "POST",
    route: "/assets/add|/assets/:id/update|/assets/:id/notes",
    capability: PermissionCapability.ASSET_ADD_EDIT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_ASSETS],
    notes: "Department scope is enforced by handlers; users with both permissions 1 and 8 can add without approval."
  },
  {
    method: "POST",
    route: "/assets/archive",
    capability: PermissionCapability.ASSET_ARCHIVE,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ARCHIVE_ASSETS],
    notes: "The handler also enforces department scope."
  },
  {
    method: "POST",
    route: "/assets/export",
    capability: PermissionCapability.ASSET_ADD_EDIT,
    currentRule: "auth-only",
    permissionIds: [],
    notes: "No dedicated permission is required; the handler enforces department scope."
  },
  {
    method: "GET",
    route: "/assets/conditions|/assets/types",
    capability: PermissionCapability.READ_ONLY_AUTHENTICATED,
    currentRule: "auth-only",
    permissionIds: [],
  },
  {
    method: "GET",
    route: "/assets/list|/assets/list/overview|/assets/lookup/tag/:tagNumber|/assets/:id/notes|/assets/:id",
    capability: PermissionCapability.READ_ONLY_AUTHENTICATED,
    currentRule: "auth-only",
    permissionIds: [],
    notes: "No dedicated permission is required; asset handlers apply department scope where applicable."
  },
  {
    method: "POST",
    route: "/audits/initiate|/audits/scan-item|/audits/submit|/audits/update-notes/:id",
    capability: PermissionCapability.AUDIT_WORKFLOW,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_ASSETS],
  },
  {
    method: "GET",
    route: "/audits/equipment/:roomId|/audits/history|/audits/history/:id|/audits/notes/:id",
    capability: PermissionCapability.AUDIT_WORKFLOW,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_ASSETS],
  },
  {
    method: "GET",
    route: "/system-notes|/system-notes/entity-types",
    capability: PermissionCapability.SYSTEM_NOTES_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
  },
  {
    method: "POST",
    route: "/system-notes",
    capability: PermissionCapability.SYSTEM_NOTES_MANAGEMENT,
    currentRule: "permission-check",
    permissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
  },
  {
    method: "GET",
    route: "/approval-requests/pending",
    capability: PermissionCapability.ASSET_APPROVAL,
    currentRule: "permission-check",
    permissionIds: [PermissionId.APPROVE_ASSET_REQUESTS],
  },
  {
    method: "POST",
    route: "/approval-requests/:id/review",
    capability: PermissionCapability.ASSET_APPROVAL,
    currentRule: "permission-check",
    permissionIds: [PermissionId.APPROVE_ASSET_REQUESTS],
  },
  {
    method: "GET",
    route: "/permissions/list|/fiscal-years/list",
    capability: PermissionCapability.READ_ONLY_AUTHENTICATED,
    currentRule: "auth-only",
    permissionIds: [],
  },
  {
    method: "POST",
    route: "/auth/login",
    capability: PermissionCapability.PUBLIC_AUTHENTICATION,
    currentRule: "public",
    permissionIds: [],
    notes: "Login is public."
  },
  {
    method: "GET",
    route: "/auth/salt|/auth/wNumber",
    capability: PermissionCapability.PUBLIC_AUTHENTICATION,
    currentRule: "public",
    permissionIds: [],
  },
  {
    method: "POST",
    route: "/auth/updatePassword",
    capability: PermissionCapability.USER_MANAGEMENT,
    currentRule: "mixed",
    permissionIds: [PermissionId.ADD_EDIT_VIEW_USERS],
    notes: "The authenticated personal-password path is self-only; the admin reset path requires permission 6."
  }
];

export const sharedPermissionPolicyCatalog = permissionPolicyCatalog;
