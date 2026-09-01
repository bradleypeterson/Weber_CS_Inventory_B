import assert from "node:assert/strict";
import { ADMIN_ADJACENT_PERMISSION_IDS, PermissionId } from "../../@types/permissions";

type MockResponse = {
  locals: Record<string, unknown>;
  statusCode: number;
  payload: unknown;
  status: (code: number) => MockResponse;
  json: (data: unknown) => MockResponse;
};

type Scope = {
  userId: number;
  personId: number;
  permissions: number[];
  isAdmin: boolean;
  departmentIds: number[];
};

function createMockResponse(user?: unknown): MockResponse {
  const locals: Record<string, unknown> = {};
  if (user !== undefined) locals.user = user;

  return {
    locals,
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.payload = data;
      return this;
    }
  };
}

function buildScope(overrides: Partial<Scope> = {}): Scope {
  return {
    userId: 1,
    personId: 1,
    permissions: [PermissionId.ADD_EDIT_ASSETS],
    isAdmin: false,
    departmentIds: [2],
    ...overrides
  };
}

type Deps = {
  canResetUserPasswords: (user: unknown) => boolean;
  getAssetAccessScope: (user: unknown) => Promise<Scope | null>;
  canAccessAssetDepartment: (scope: Scope, departmentId?: number | null) => boolean;
  previewImportHandler: (req: { body: unknown }, res: MockResponse) => Promise<void>;
  importAssetsHandler: (req: { body: unknown }, res: MockResponse) => Promise<void>;
  usersDb: {
    getDepartmentIDsByPersonID: (personId: number) => Promise<number[]>;
  };
  assetScopeModule: {
    getAssetAccessScope: (user: unknown) => Promise<Scope | null>;
  };
};

function loadDeps(): Deps {
  const { canResetUserPasswords } = require("../src/auth/passwordResetPermission") as Deps;
  const { getAssetAccessScope, canAccessAssetDepartment } = require("../src/auth/assetScope") as Deps;
  const { previewImportHandler, importAssetsHandler } = require("../src/imports/import") as Deps;
  const usersDb = require("../src/db/procedures/users") as Deps["usersDb"];
  const assetScopeModule = require("../src/auth/assetScope") as Deps["assetScopeModule"];

  return {
    canResetUserPasswords,
    getAssetAccessScope,
    canAccessAssetDepartment,
    previewImportHandler,
    importAssetsHandler,
    usersDb,
    assetScopeModule
  };
}

async function run() {
  const deps = loadDeps();

  // Regression: reset-password capability still depends on permission 6 only.
  {
    const userWithPermissionSix = { UserID: 1, PersonID: 1, Salt: "s", Permissions: [PermissionId.ADD_EDIT_VIEW_USERS] };
    const userWithPermissionSevenOnly = { UserID: 1, PersonID: 1, Salt: "s", Permissions: [PermissionId.SET_USER_PERMISSIONS] };
    assert.equal(deps.canResetUserPasswords(userWithPermissionSix), true);
    assert.equal(deps.canResetUserPasswords(userWithPermissionSevenOnly), false);
  }

  const originalGetDepartmentIDsByPersonID = deps.usersDb.getDepartmentIDsByPersonID;

  try {
    deps.usersDb.getDepartmentIDsByPersonID = async () => [10, 20];

    // Regression: admin-adjacent permissions (3-7) still produce admin scope.
    for (const adminPermissionId of ADMIN_ADJACENT_PERMISSION_IDS) {
      const scope = await deps.getAssetAccessScope({
        UserID: 9,
        PersonID: 2,
        Salt: "salt",
        Permissions: [adminPermissionId]
      });
      assert.ok(scope !== null);
      assert.equal(scope.isAdmin, true);
      assert.deepEqual(scope.departmentIds, []);
    }

    // Regression: non-admin users stay department-scoped.
    {
      const scope = await deps.getAssetAccessScope({
        UserID: 9,
        PersonID: 2,
        Salt: "salt",
        Permissions: [PermissionId.ADD_EDIT_ASSETS]
      });
      assert.ok(scope !== null);
      assert.equal(scope.isAdmin, false);
      assert.deepEqual(scope.departmentIds, [10, 20]);
      assert.equal(deps.canAccessAssetDepartment(scope, 10), true);
      assert.equal(deps.canAccessAssetDepartment(scope, 999), false);
    }
  } finally {
    deps.usersDb.getDepartmentIDsByPersonID = originalGetDepartmentIDsByPersonID;
  }

  const originalGetAssetAccessScope = deps.assetScopeModule.getAssetAccessScope;
  try {
    // Regression: import preview/import still reject unknown users.
    deps.assetScopeModule.getAssetAccessScope = async () => null;
    {
      const res = createMockResponse(undefined);
      await deps.previewImportHandler({ body: {} }, res);
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.payload, { status: "error", error: { message: "Unknown user" } });
    }
    {
      const res = createMockResponse(undefined);
      await deps.importAssetsHandler({ body: {} }, res);
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.payload, { status: "error", error: { message: "Unknown user" } });
    }

    // Regression: import preview/import still reject non-admin scope.
    deps.assetScopeModule.getAssetAccessScope = async () => buildScope({ isAdmin: false });
    {
      const res = createMockResponse({});
      await deps.previewImportHandler({ body: {} }, res);
      assert.equal(res.statusCode, 403);
      assert.deepEqual(res.payload, { status: "error", error: { message: "Admin permission is required for import." } });
    }
    {
      const res = createMockResponse({});
      await deps.importAssetsHandler({ body: {} }, res);
      assert.equal(res.statusCode, 403);
      assert.deepEqual(res.payload, { status: "error", error: { message: "Admin permission is required for import." } });
    }

    // Regression: with admin scope, handlers still continue to normal request validation.
    deps.assetScopeModule.getAssetAccessScope = async () => buildScope({ isAdmin: true, permissions: [PermissionId.IMPORT_CSV_DATA] });
    {
      const res = createMockResponse({});
      await deps.previewImportHandler({ body: { fileName: 1, fileContents: null } }, res);
      assert.equal(res.statusCode, 400);
      assert.deepEqual(res.payload, {
        status: "error",
        error: { message: "Invalid request body. Expected { fileName, fileContents }." }
      });
    }
    {
      const res = createMockResponse({});
      await deps.importAssetsHandler({ body: { fileName: 1, rows: null } }, res);
      assert.equal(res.statusCode, 400);
      assert.deepEqual(res.payload, {
        status: "error",
        error: { message: "Invalid request body. Expected { fileName, rows }." }
      });
    }
  } finally {
    deps.assetScopeModule.getAssetAccessScope = originalGetAssetAccessScope;
  }

  console.log("All authz parity tests passed.");
}

void run();
