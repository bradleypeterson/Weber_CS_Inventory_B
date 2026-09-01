import assert from "node:assert/strict";

type UpdatePasswordFn = (req: { body: unknown }, res: MockResponse) => Promise<void>;

type MockResponse = {
  locals: Record<string, unknown>;
  statusCode: number;
  payload: unknown;
  status: (code: number) => MockResponse;
  json: (data: unknown) => MockResponse;
};

function createMockResponse(user?: unknown): MockResponse {
  const locals: Record<string, unknown> = {};
  if (user !== undefined) locals.user = user;

  const response: MockResponse = {
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

  return response;
}

type PasswordParams = {
  userID: string;
  hashedOldPassword: string;
  hashedNewPassword: string;
  newSalt: string;
  updateType: string;
};

function baseParams(overrides: Partial<PasswordParams> = {}): PasswordParams {
  return {
    userID: "2",
    hashedOldPassword: "old-hash",
    hashedNewPassword: "new-hash",
    newSalt: "new-salt",
    updateType: "personal",
    ...overrides
  };
}

type TestDeps = {
  updatePassword: UpdatePasswordFn;
  authRouter: any;
  validateToken: (...args: any[]) => unknown;
  authDb: {
    getUserDetails: (...args: any[]) => Promise<unknown>;
    changePassword: (...args: any[]) => Promise<unknown>;
  };
  validateTokenModule: {
    validateUser: (user: unknown) => boolean;
  };
  canResetUserPasswords: (user: unknown) => boolean;
};

function loadDeps(): TestDeps {
  const { updatePassword } = require("../src/auth/updatePassword") as { updatePassword: UpdatePasswordFn };
  const { authRouter } = require("../src/auth") as { authRouter: any };
  const { validateToken } = require("../src/auth/validateToken") as { validateToken: (...args: any[]) => unknown };
  const authDb = require("../src/db/procedures/auth") as TestDeps["authDb"];
  const validateTokenModule = require("../src/auth/validateToken") as TestDeps["validateTokenModule"];
  const { canResetUserPasswords } = require("../src/auth/passwordResetPermission") as {
    canResetUserPasswords: (user: unknown) => boolean;
  };

  return {
    updatePassword,
    authRouter,
    validateToken,
    authDb,
    validateTokenModule,
    canResetUserPasswords
  };
}

function getRouteHandlers(router: any, method: "get" | "post", path: string): Array<(...args: any[]) => unknown> {
  const layer = router.stack.find(
    (entry: any) => entry.route !== undefined && entry.route.path === path && entry.route.methods?.[method] === true
  );
  assert.ok(layer, `Expected ${method.toUpperCase()} ${path} to exist`);
  return layer.route.stack.map((stackEntry: any) => stackEntry.handle);
}

async function run() {
  const deps = loadDeps();

  // Regression: only /auth/updatePassword should require validateToken in auth router.
  {
    const updatePasswordHandlers = getRouteHandlers(deps.authRouter, "post", "/updatePassword");
    assert.equal(updatePasswordHandlers.length, 2);
    assert.equal(updatePasswordHandlers[0], deps.validateToken);

    const loginHandlers = getRouteHandlers(deps.authRouter, "post", "/login");
    assert.equal(loginHandlers.length, 1);
    assert.notEqual(loginHandlers[0], deps.validateToken);

    const saltHandlers = getRouteHandlers(deps.authRouter, "get", "/salt");
    assert.equal(saltHandlers.length, 1);
    assert.notEqual(saltHandlers[0], deps.validateToken);

    const wNumberHandlers = getRouteHandlers(deps.authRouter, "get", "/wNumber");
    assert.equal(wNumberHandlers.length, 1);
    assert.notEqual(wNumberHandlers[0], deps.validateToken);
  }

  // Regression: permission helper allows reset only when permission 6 is present.
  {
    const permissionSixUser = { UserID: 1, PersonID: 1, Salt: "s", Permissions: [6] };
    const permissionSevenOnlyUser = { UserID: 1, PersonID: 1, Salt: "s", Permissions: [7] };
    assert.equal(deps.canResetUserPasswords(permissionSixUser), true);
    assert.equal(deps.canResetUserPasswords(permissionSevenOnlyUser), false);
  }

  const originalGetUserDetails = deps.authDb.getUserDetails;
  const originalChangePassword = deps.authDb.changePassword;
  const originalValidateUser = deps.validateTokenModule.validateUser;

  try {
    let storedPassword = "stored-old-hash";
    let changedPasswords: Array<{ userID: string; hashedNewPassword: string; newSalt: string }> = [];
    let forceValidateUser = true;

    deps.authDb.getUserDetails = async () => ({ HashedPassword: storedPassword });
    deps.authDb.changePassword = async (userID: string, hashedNewPassword: string, newSalt: string) => {
      changedPasswords.push({ userID, hashedNewPassword, newSalt });
      return {};
    };
    deps.validateTokenModule.validateUser = () => forceValidateUser;

    // 1) Unauthenticated request is rejected.
    {
      forceValidateUser = false;
      changedPasswords = [];
      const res = createMockResponse(undefined);
      await deps.updatePassword({ body: baseParams({ updateType: "admin" }) }, res);
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.payload, { status: "error", error: { message: "Unauthenticated" } });
      assert.equal(changedPasswords.length, 0);
    }

    // 2) Authenticated user with permission 6 can admin-reset another user password.
    {
      forceValidateUser = true;
      changedPasswords = [];
      const requester = { UserID: 99, PersonID: 10, Salt: "req-salt", Permissions: [6] };
      const res = createMockResponse(requester);
      await deps.updatePassword({ body: baseParams({ userID: "2", updateType: "admin" }) }, res);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.payload, { status: "success", data: { userID: "2" } });
      assert.equal(changedPasswords.length, 1);
      assert.deepEqual(changedPasswords[0], { userID: "2", hashedNewPassword: "new-hash", newSalt: "new-salt" });
    }

    // 3) Authenticated user without permission 6 cannot admin-reset.
    {
      forceValidateUser = true;
      changedPasswords = [];
      const requester = { UserID: 99, PersonID: 10, Salt: "req-salt", Permissions: [7] };
      const res = createMockResponse(requester);
      await deps.updatePassword({ body: baseParams({ userID: "2", updateType: "admin" }) }, res);
      assert.equal(res.statusCode, 403);
      assert.deepEqual(res.payload, { status: "error", error: { message: "Unauthorized" } });
      assert.equal(changedPasswords.length, 0);
    }

    // 4) Authenticated user can change their own password when old hash matches.
    {
      forceValidateUser = true;
      changedPasswords = [];
      storedPassword = "match-hash";
      const requester = { UserID: 2, PersonID: 2, Salt: "req-salt", Permissions: [1] };
      const res = createMockResponse(requester);
      await deps.updatePassword(
        { body: baseParams({ userID: "2", updateType: "personal", hashedOldPassword: "match-hash" }) },
        res
      );
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.payload, { status: "success", data: { userID: "2" } });
      assert.equal(changedPasswords.length, 1);
    }

    // 5) Authenticated user with wrong old hash is rejected.
    {
      forceValidateUser = true;
      changedPasswords = [];
      storedPassword = "expected-old-hash";
      const requester = { UserID: 2, PersonID: 2, Salt: "req-salt", Permissions: [1] };
      const res = createMockResponse(requester);
      await deps.updatePassword(
        { body: baseParams({ userID: "2", updateType: "personal", hashedOldPassword: "wrong-old-hash" }) },
        res
      );
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.payload, { status: "error", error: { message: "Invalid old password" } });
      assert.equal(changedPasswords.length, 0);
    }

    // 6) Authenticated user cannot change another user's password via personal path.
    {
      forceValidateUser = true;
      changedPasswords = [];
      storedPassword = "match-hash";
      const requester = { UserID: 99, PersonID: 10, Salt: "req-salt", Permissions: [1] };
      const res = createMockResponse(requester);
      await deps.updatePassword(
        { body: baseParams({ userID: "2", updateType: "personal", hashedOldPassword: "match-hash" }) },
        res
      );
      assert.equal(res.statusCode, 403);
      assert.deepEqual(res.payload, { status: "error", error: { message: "Unauthorized" } });
      assert.equal(changedPasswords.length, 0);
    }
  } finally {
    deps.authDb.getUserDetails = originalGetUserDetails;
    deps.authDb.changePassword = originalChangePassword;
    deps.validateTokenModule.validateUser = originalValidateUser;
  }

  console.log("All auth security tests passed.");
}

void run();
