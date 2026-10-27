import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { pool } from "../src/db";
import * as sessions from "../src/db/procedures/sessions";
import { validateToken } from "../src/auth/validateToken";
import { activity, logout } from "../src/auth/session";

function response() {
  return {
    locals: {} as Record<string, any>,
    statusCode: 200,
    payload: undefined as any,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.payload = payload; return this; }
  };
}

async function run() {
  const original = { ...sessions };
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "session-test-secret";
  const user = {
    UserID: 1, PersonID: 1, Salt: "test", Permissions: [],
    SessionID: "12345678-1234-4123-8123-123456789abc"
  };
  const request = (payload: object) => ({
    header: () => `Bearer ${sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" })}`
  }) as unknown as Request;
  let checks = 0;
  let active = true;
  Object.assign(sessions, {
    isSessionActive: async (id: string, userID: number) => {
      checks++;
      assert.equal(id, user.SessionID);
      assert.equal(userID, user.UserID);
      return active;
    }
  });
  try {
    let called = false;
    const valid = response();
    await validateToken(request(user), valid as unknown as Response, () => { called = true; });
    assert.equal(called, true);
    assert.equal(valid.locals.user.SessionID, user.SessionID);

    active = false;
    const expired = response();
    await validateToken(request(user), expired as unknown as Response, () => assert.fail("Expired session accepted"));
    assert.equal(expired.statusCode, 401);
    assert.equal(expired.payload.error.code, "SESSION_EXPIRED");

    const previousChecks = checks;
    const { SessionID: _sessionID, ...legacyUser } = user;
    const legacy = response();
    await validateToken(request(legacyUser), legacy as unknown as Response, () => assert.fail("Legacy JWT accepted"));
    assert.equal(legacy.statusCode, 401);
    assert.equal(checks, previousChecks);

    const jwtExpired = response();
    const expiredRequest = { header: () => `Bearer ${sign(user, process.env.JWT_SECRET!, { expiresIn: -1 })}` };
    await validateToken(expiredRequest as unknown as Request, jwtExpired as unknown as Response, () => assert.fail("Expired JWT accepted"));
    assert.equal(jwtExpired.statusCode, 401);
    assert.equal(checks, previousChecks);

    Object.assign(sessions, { isSessionActive: async () => { throw new Error("DB unavailable"); } });
    const unavailable = response();
    await validateToken(request(user), unavailable as unknown as Response, () => assert.fail("DB failure accepted"));
    assert.equal(unavailable.statusCode, 503);

    Object.assign(sessions, { touchSession: async () => false });
    const lateActivity = response();
    lateActivity.locals.user = user;
    await activity({} as Request, lateActivity as unknown as Response);
    assert.equal(lateActivity.statusCode, 401);

    Object.assign(sessions, { touchSession: async () => true });
    const continued = response();
    continued.locals.user = user;
    await activity({} as Request, continued as unknown as Response);
    assert.equal(continued.payload.status, "success");

    let deleted = false;
    Object.assign(sessions, { deleteSession: async (id: string, userID: number) => {
      assert.equal(id, user.SessionID);
      assert.equal(userID, user.UserID);
      deleted = true;
    } });
    const loggedOut = response();
    loggedOut.locals.user = user;
    await logout({} as Request, loggedOut as unknown as Response);
    assert.equal(deleted, true);
    assert.equal(loggedOut.payload.status, "success");
    console.log("Session authentication tests passed.");
  } finally {
    Object.assign(sessions, original);
    if (secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secret;
    await pool.end();
  }
}

void run().catch(error => { console.error(error); process.exitCode = 1; });
