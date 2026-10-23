import assert from "node:assert/strict";
import { ALL_PERMISSION_IDS, canViewAnalytics } from "../../@types/permissions";

async function run() {
  // Supply inert defaults so this test needs no running database.
  for (const [key, value] of Object.entries({ DB_HOST: "localhost", DB_USER: "test", DB_PASSWORD: "test", DB_PORT: "3306", DB_NAME: "test" })) {
    process.env[key] ??= value;
  }
  const { pool } = require("../src/db");
  const { getAssetAnalytics } = require("../src/db/procedures/analytics");
  const originalQuery = pool.query;
  let calls = 0;
  let sql = "";
  let params: number[] = [];
  pool.query = async (query: string, values: number[]) => {
    calls++;
    sql = query;
    params = values;
    return [[
      { DepartmentID: 2, DepartmentName: "CS", DeviceTypeID: 1, DeviceTypeName: "Laptop", AssetCount: "3" },
      { DepartmentID: 2, DepartmentName: "CS", DeviceTypeID: null, DeviceTypeName: null, AssetCount: 2 },
      { DepartmentID: null, DepartmentName: null, DeviceTypeID: 1, DeviceTypeName: "Laptop", AssetCount: 1 }
    ]];
  };
  try {
    assert.deepEqual(await getAssetAnalytics([]), { totalActiveAssets: 0, byDepartment: [], byDeviceType: [] });
    assert.equal(calls, 0);
    const result = await getAssetAnalytics();
    assert.equal(result.totalActiveAssets, 6);
    assert.deepEqual(result.byDepartment, [{ id: 2, name: "CS", count: 5 }, { id: null, name: "Unassigned", count: 1 }]);
    assert.deepEqual(result.byDeviceType, [{ id: 1, name: "Laptop", count: 4 }, { id: null, name: "Unassigned", count: 2 }]);
    assert.doesNotMatch(sql, /DepartmentID IN/);
    assert.match(sql, /e.ArchiveStatus = 0/);
    assert.match(sql, /e.Deleted = 0 OR e.Deleted IS NULL/);
    await getAssetAnalytics([2, 7]);
    assert.match(sql, /e.DepartmentID IN \(\?,\?\)/);
    assert.deepEqual(params, [2, 7]);
    pool.query = async () => [[]];
    assert.deepEqual(await getAssetAnalytics([2]), { totalActiveAssets: 0, byDepartment: [], byDeviceType: [] });
    const { getAssetAnalyticsHandler } = require("../src/analytics");
    const usersDb = require("../src/db/procedures/users");
    const originalDepartments = usersDb.getDepartmentIDsByPersonID;
    const response = (permissions?: number[]) => ({
      locals: { user: permissions === undefined ? undefined : { UserID: 1, PersonID: 1, Salt: "s", Permissions: permissions } },
      statusCode: 200,
      payload: undefined as any,
      status(code: number) { this.statusCode = code; return this; },
      json(payload: unknown) { this.payload = payload; return this; }
    });
    let analyticsQueries = 0;
    let departmentQueries = 0;
    pool.query = async (query: string, values: number[]) => {
      analyticsQueries++;
      sql = query;
      params = values;
      return [[]];
    };
    usersDb.getDepartmentIDsByPersonID = async () => { departmentQueries++; return [2]; };
    try {
      assert.equal(canViewAnalytics([]), false);
      assert.equal(canViewAnalytics([999]), false);
      const anonymous = response();
      await getAssetAnalyticsHandler({}, anonymous);
      assert.equal(anonymous.statusCode, 401);
      const noPermissions = response([]); // W01111119's permission profile.
      await getAssetAnalyticsHandler({}, noPermissions);
      assert.equal(noPermissions.statusCode, 403);
      assert.equal(analyticsQueries, 0);
      assert.equal(departmentQueries, 0);
      assert.equal(noPermissions.payload.data, undefined);
      for (const permission of ALL_PERMISSION_IDS) {
        assert.equal(canViewAnalytics([permission]), true);
        const allowed = response([permission]);
        await getAssetAnalyticsHandler({}, allowed);
        assert.equal(allowed.statusCode, 200);
        assert.equal(allowed.payload.status, "success");
        if (permission <= 2) {
          assert.match(sql, /e.DepartmentID IN \(\?\)/);
          assert.deepEqual(params, [2]);
        } else {
          assert.doesNotMatch(sql, /DepartmentID IN/);
          assert.deepEqual(params, []);
        }
      }
    } finally {
      usersDb.getDepartmentIDsByPersonID = originalDepartments;
    }
    console.log("Analytics aggregation, feature authorization, and department scope tests passed.");
  } finally {
    pool.query = originalQuery;
    await pool.end();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
