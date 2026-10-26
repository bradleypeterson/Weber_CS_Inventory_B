// Numeric permission IDs mirror the rows in the Permission DB table.
// Keep these stable unless a DB/data migration is planned.
export const PermissionId = {
  // Can add/edit asset records, asset notes, and audit workflows.
  ADD_EDIT_ASSETS: 1,
  // Can archive assets.
  ARCHIVE_ASSETS: 2,
  // Canonical "import CSV" permission (label intentionally import-only).
  IMPORT_CSV_DATA: 3,
  // Can manage contacts (non-user persons and related contact operations).
  ADD_EDIT_CONTACT_PERSONS: 4,
  // Can add, update, delete, and restore list-option entities.
  ADD_EDIT_LIST_OPTIONS: 5,
  // Can add/edit/view users and reset passwords; permission assignment is permission 7.
  ADD_EDIT_VIEW_USERS: 6,
  // Can assign/revoke permissions on user records.
  SET_USER_PERMISSIONS: 7,
  // Can approve pending asset additions.
  APPROVE_ASSET_REQUESTS: 8
} as const;

// Union of all numeric permission values (1 | 2 | ... | 8).
export type PermissionIdValue = (typeof PermissionId)[keyof typeof PermissionId];

// Ordered list of every defined permission ID.
// Useful when building loops/forms/validation over all permission flags.
export const ALL_PERMISSION_IDS = [
  PermissionId.ADD_EDIT_ASSETS,
  PermissionId.ARCHIVE_ASSETS,
  PermissionId.IMPORT_CSV_DATA,
  PermissionId.ADD_EDIT_CONTACT_PERSONS,
  PermissionId.ADD_EDIT_LIST_OPTIONS,
  PermissionId.ADD_EDIT_VIEW_USERS,
  PermissionId.SET_USER_PERMISSIONS,
  PermissionId.APPROVE_ASSET_REQUESTS
] as const;

// Legacy grouping used by assetScope.ts to grant global asset-department scope.
// These IDs do not replace route-specific permission checks.
export const ADMIN_ADJACENT_PERMISSION_IDS = [
  PermissionId.IMPORT_CSV_DATA,
  PermissionId.ADD_EDIT_CONTACT_PERSONS,
  PermissionId.ADD_EDIT_LIST_OPTIONS,
  PermissionId.ADD_EDIT_VIEW_USERS,
  PermissionId.SET_USER_PERMISSIONS,
  PermissionId.APPROVE_ASSET_REQUESTS
] as const;

// Human-readable labels keyed by permission ID.
// Used for UI text and generated permission forms; semantic labels are seeded in db/seed_data.ts.
export const PERMISSION_DISPLAY_NAMES = {
  [PermissionId.ADD_EDIT_ASSETS]: "Add/Edit Assets",
  [PermissionId.ARCHIVE_ASSETS]: "Archive Assets",
  [PermissionId.IMPORT_CSV_DATA]: "Import CSV Data",
  [PermissionId.ADD_EDIT_CONTACT_PERSONS]: "Add/Edit Contact Persons",
  [PermissionId.ADD_EDIT_LIST_OPTIONS]: "Add/Edit List Options",
  [PermissionId.ADD_EDIT_VIEW_USERS]: "Add/Edit/View Users including changing user passwords",
  [PermissionId.SET_USER_PERMISSIONS]: "Set User Permissions",
  [PermissionId.APPROVE_ASSET_REQUESTS]: "Approve Asset Requests"
} as const satisfies Record<PermissionIdValue, string>;

// True when a user has one specific permission ID.
export function hasPermission(permissions: readonly number[], permissionId: PermissionIdValue) {
  return permissions.includes(permissionId);
}

// True when a user has at least one permission from a provided set.
export function hasAnyPermission(permissions: readonly number[], permissionIds: readonly number[]) {
  return permissionIds.some((permissionId) => permissions.includes(permissionId));
}

// Capability keys are domain-level permission intents (not DB permission IDs).
// These are used to map behavior/policy across backend and frontend.
export const PermissionCapability = {
  // Asset create/edit workflows.
  ASSET_ADD_EDIT: "asset.addEdit",
  // Asset archive workflows.
  ASSET_ARCHIVE: "asset.archive",
  // CSV import workflows.
  CSV_IMPORT: "import.csv",
  // Contact CRUD workflows.
  CONTACT_MANAGEMENT: "contact.manage",
  // List-option CRUD workflows.
  LIST_OPTION_MANAGEMENT: "listOption.manage",
  // User CRUD/password-admin workflows.
  USER_MANAGEMENT: "user.manage",
  // User permission assignment workflows.
  USER_PERMISSION_MANAGEMENT: "user.permissions.manage",
  // Audit initiate/scan/submit/history workflows.
  AUDIT_WORKFLOW: "audit.workflow",
  // System note create/list workflows.
  SYSTEM_NOTES_MANAGEMENT: "systemNotes.manage",
  // Routes that are authenticated-only and do not map to a specific permission ID.
  READ_ONLY_AUTHENTICATED: "read.authenticated",
  // Authentication endpoints available without a token.
  PUBLIC_AUTHENTICATION: "auth.public",
  // Approval of new asset requests.
  ASSET_APPROVAL: "asset.approval",
} as const;

// Union of all capability string values.
export type PermissionCapabilityKey = (typeof PermissionCapability)[keyof typeof PermissionCapability];

// One policy row describing intent vs current backend/frontend enforcement.
export type PermissionPolicyEntry = {
  // Domain capability this policy row describes.
  capability: PermissionCapabilityKey;
  // Intended permission IDs for this capability.
  // Empty when capability is auth-only (no dedicated permission ID).
  intendedPermissionIds: readonly PermissionIdValue[];
  // Current backend enforcement summary.
  backendRule: string;
  // Current frontend visibility/gating summary.
  frontendRule: string;
  // Optional known deviations between intent and current enforcement.
  knownMismatches?: readonly string[];
};

// Central policy catalog used as a living map of current behavior + intent.
// This is documentation/data for centralization; it does not enforce by itself.
export const permissionPolicyCatalog: readonly PermissionPolicyEntry[] = [
  // Asset add/edit capability policy.
  {
    capability: PermissionCapability.ASSET_ADD_EDIT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_ASSETS],
    backendRule: "Asset add, update, and note creation require permission 1. Handlers enforce department scope; users with permission 1 and permission 8 can add without approval.",
    frontendRule: "Add/Edit asset actions use permission 1 checks.",
  },
  {
    capability: PermissionCapability.ASSET_ARCHIVE,
    intendedPermissionIds: [PermissionId.ARCHIVE_ASSETS],
    backendRule: "Asset archive route requires permission 2 and enforces department scope.",
    frontendRule: "Archive controls do not appear to check permission 2; the API rejects unauthorized archive requests.",
    knownMismatches: [
      "The asset archive UI does not appear to be gated by permission 2."
    ]
  },
  // CSV import capability policy.
  {
    capability: PermissionCapability.CSV_IMPORT,
    intendedPermissionIds: [PermissionId.IMPORT_CSV_DATA],
    backendRule: "Import and preview routes require permission 3. The asset scope helper grants global asset-department scope to permissions 3-8.",
    frontendRule: "Import dashboard visibility currently checks permission 3.",
    knownMismatches: [
      "The legacy asset scope grouping grants global asset-department scope to permissions 4-8 as well; this is separate from import route authorization."
    ]
  },
  // Contact management capability policy.
  {
    capability: PermissionCapability.CONTACT_MANAGEMENT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_CONTACT_PERSONS],
    backendRule: "Contact add, update, and archive routes require permission 4; list and detail routes require authentication only.",
    frontendRule: "Contacts dashboard/actions use permission 4."
  },
  // List option management capability policy.
  {
    capability: PermissionCapability.LIST_OPTION_MANAGEMENT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
    backendRule: "List-option add, update, delete, and restore routes require permission 5; list routes require authentication only.",
    frontendRule: "List options dashboard visibility uses permission 5."
  },
  // User management capability policy.
  {
    capability: PermissionCapability.USER_MANAGEMENT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_VIEW_USERS],
    backendRule: "User list, detail, archive, and update routes require permission 6. Add and promote routes require permissions 6 and 7. Admin password reset requires permission 6.",
    frontendRule: "User dashboard/edit actions use permission 6.",
    knownMismatches: [
      "The user update handler accepts a Permissions field, but the route does not require permission 7 for that field."
    ]
  },
  // User permission assignment capability policy.
  {
    capability: PermissionCapability.USER_PERMISSION_MANAGEMENT,
    intendedPermissionIds: [PermissionId.SET_USER_PERMISSIONS],
    backendRule: "User add and promote routes require permission 7 in addition to permission 6. The user update route does not currently enforce permission 7 when its Permissions field is supplied.",
    frontendRule: "Permission-edit UI is gated by permission 7."
  },
  // Audit workflow capability policy.
  {
    capability: PermissionCapability.AUDIT_WORKFLOW,
    intendedPermissionIds: [PermissionId.ADD_EDIT_ASSETS],
    backendRule: "All audit routes require permission 1.",
    frontendRule: "Audit dashboards/pages use permission 1 checks."
  },
  // System notes capability policy.
  {
    capability: PermissionCapability.SYSTEM_NOTES_MANAGEMENT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
    backendRule: "System-note create, list, and entity-type routes require permission 5.",
    frontendRule: "System notes dashboard visibility uses permission 5."
  },
  // Authenticated-only read capability policy (no specific permission ID).
  {
    capability: PermissionCapability.READ_ONLY_AUTHENTICATED,
    intendedPermissionIds: [],
    backendRule: "Routes documented as auth-only require the global authentication middleware; asset export additionally enforces department scope.",
    frontendRule: "Some direct page routes remain always available in navigation config."
  },
  {
    capability: PermissionCapability.PUBLIC_AUTHENTICATION,
    intendedPermissionIds: [],
    backendRule: "Login, salt, and W-number lookup routes are public and do not require a token.",
    frontendRule: "Authentication flows use these public endpoints."
  },
  // Asset approval capability policy.
  {
    capability: PermissionCapability.ASSET_APPROVAL,
    intendedPermissionIds: [PermissionId.APPROVE_ASSET_REQUESTS],
    backendRule: "Pending-request and review routes require permission 8. Asset addition requires permission 1; users who also have permission 8 can add without approval.",
    frontendRule: "Pending approvals page is available to permission 8 users."
  }
];
