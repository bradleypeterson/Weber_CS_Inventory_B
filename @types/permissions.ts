// Numeric permission IDs mirror the rows in the Permission DB table.
// Keep these stable unless a DB/data migration is planned.
export const PermissionId = {
  // Can add/edit asset records and associated asset-edit workflows in the UI.
  ADD_EDIT_ASSETS: 1,
  // Can archive assets.
  ARCHIVE_ASSETS: 2,
  // Canonical "import CSV" permission (label intentionally import-only).
  IMPORT_CSV_DATA: 3,
  // Can manage contacts (non-user persons and related contact operations).
  ADD_EDIT_CONTACT_PERSONS: 4,
  // Can manage list-option entities (building, room, condition, etc.).
  ADD_EDIT_LIST_OPTIONS: 5,
  // Can manage users, including admin password resets.
  ADD_EDIT_VIEW_USERS: 6,
  // Can assign/revoke permissions on user records.
  SET_USER_PERMISSIONS: 7
} as const;

// Union of all numeric permission values (1 | 2 | ... | 7).
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
  PermissionId.SET_USER_PERMISSIONS
] as const;

// Legacy grouping used by some UI/backend behavior to represent admin-like users.
// Note: this grouping may differ from per-capability intent in the policy catalog.
export const ADMIN_ADJACENT_PERMISSION_IDS = [
  PermissionId.IMPORT_CSV_DATA,
  PermissionId.ADD_EDIT_CONTACT_PERSONS,
  PermissionId.ADD_EDIT_LIST_OPTIONS,
  PermissionId.ADD_EDIT_VIEW_USERS,
  PermissionId.SET_USER_PERMISSIONS
] as const;

// Human-readable labels keyed by permission ID.
// Used for UI text and generated permission forms. Matches db/seed_data.ts name and
// description values in permission table.
export const PERMISSION_DISPLAY_NAMES = {
  [PermissionId.ADD_EDIT_ASSETS]: "Add/Edit Assets",
  [PermissionId.ARCHIVE_ASSETS]: "Archive Assets",
  [PermissionId.IMPORT_CSV_DATA]: "Import CSV Data",
  [PermissionId.ADD_EDIT_CONTACT_PERSONS]: "Add/Edit Contact Persons",
  [PermissionId.ADD_EDIT_LIST_OPTIONS]: "Add/Edit List Options",
  [PermissionId.ADD_EDIT_VIEW_USERS]: "Add/Edit/View Users including changing user passwords",
  [PermissionId.SET_USER_PERMISSIONS]: "Set User Permissions"
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
  READ_ONLY_AUTHENTICATED: "read.authenticated"
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
    backendRule: "Scoped in asset handlers via asset access scope and department access checks.",
    frontendRule: "Add/Edit asset actions use permission 1 checks.",
  },
  // CSV import capability policy.
  {
    capability: PermissionCapability.CSV_IMPORT,
    intendedPermissionIds: [PermissionId.IMPORT_CSV_DATA],
    backendRule: "Import routes require admin-adjacent scope (permissions 3-7) via asset scope helper.",
    frontendRule: "Import dashboard visibility currently checks permission 3.",
    knownMismatches: [
      "Backend import access accepts 3-7 while UI import entry uses permission 3.",
      "Permission 3 label now uses import-only wording; enforcement remains unchanged in this phase."
    ]
  },
  // Contact management capability policy.
  {
    capability: PermissionCapability.CONTACT_MANAGEMENT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_CONTACT_PERSONS],
    backendRule: "Contacts CRUD routes are currently auth-only.",
    frontendRule: "Contacts dashboard/actions use permission 4."
  },
  // List option management capability policy.
  {
    capability: PermissionCapability.LIST_OPTION_MANAGEMENT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
    backendRule: "List-option CRUD routes are currently auth-only.",
    frontendRule: "List options dashboard visibility uses permission 5."
  },
  // User management capability policy.
  {
    capability: PermissionCapability.USER_MANAGEMENT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_VIEW_USERS],
    backendRule: "Users CRUD routes are mostly auth-only; password reset admin path enforces permission 6.",
    frontendRule: "User dashboard/edit actions use permission 6."
  },
  // User permission assignment capability policy.
  {
    capability: PermissionCapability.USER_PERMISSION_MANAGEMENT,
    intendedPermissionIds: [PermissionId.SET_USER_PERMISSIONS],
    backendRule: "No centralized backend permission middleware for user permission management yet.",
    frontendRule: "Permission-edit UI is gated by permission 7."
  },
  // Audit workflow capability policy.
  {
    capability: PermissionCapability.AUDIT_WORKFLOW,
    intendedPermissionIds: [PermissionId.ADD_EDIT_ASSETS],
    backendRule: "Audit routes are currently auth-only.",
    frontendRule: "Audit dashboards/pages use permission 1 checks."
  },
  // System notes capability policy.
  {
    capability: PermissionCapability.SYSTEM_NOTES_MANAGEMENT,
    intendedPermissionIds: [PermissionId.ADD_EDIT_LIST_OPTIONS],
    backendRule: "System note create uses validateUser and list is auth-only.",
    frontendRule: "System notes dashboard visibility uses permission 5."
  },
  // Authenticated-only read capability policy (no specific permission ID).
  {
    capability: PermissionCapability.READ_ONLY_AUTHENTICATED,
    intendedPermissionIds: [],
    backendRule: "Several list/detail routes are available to any authenticated user.",
    frontendRule: "Some direct page routes remain always available in navigation config."
  }
];
