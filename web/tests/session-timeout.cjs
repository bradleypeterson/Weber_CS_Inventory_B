// Run with: node tests/session-timeout.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

async function run() {
  let now = 100_000;
  const storage = new Map();
  const listeners = new Map();
  let tick;
  const token = `header.${Buffer.from(JSON.stringify({ exp: 100_000_000 })).toString("base64url")}.signature`;
  storage.set("token", token);
  const browser = {
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name) { listeners.delete(name); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); },
    setInterval(fn) { tick = fn; return 1; },
    clearInterval() { tick = undefined; }
  };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  };
  let responseStatus = 401;
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS }
    }).outputText;
    vm.runInNewContext(code, {
      exports,
      require: relative => load(path.resolve(path.dirname(filename), relative + ".ts")),
      Date: { now: () => now }, atob, localStorage,
      window: browser,
      document: browser,
      Headers,
      CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
      fetch: async () => ({ status: responseStatus })
    });
    return exports;
  }

  const activity = load(path.join(__dirname, "../src/auth/sessionActivity.ts"));
  const timeout = load(path.join(__dirname, "../src/auth/sessionTimeout.ts"));
  const { sessionConfig } = load(path.join(__dirname, "../../shared/sessionConfig.ts"));
  activity.initializeSessionActivity(token);
  assert.equal(timeout.getSessionStatus(token).warning, false);
  now = 100_000 + sessionConfig.warningAfterMs;
  assert.equal(timeout.getSessionStatus(token).warning, true);
  assert.equal(timeout.getSessionStatus(token).expired, false);
  now = 100_000 + sessionConfig.logoutAfterMs;
  assert.equal(timeout.getSessionStatus(token).expired, true);

  now = 100_000;
  let status;
  const cleanup = timeout.watchSessionTimeout(token, value => { status = value; });
  assert.equal(status.expired, false);
  now += sessionConfig.logoutAfterMs + 1;
  browser.dispatchEvent({ type: "pageshow" });
  assert.equal(status.expired, true, "Wake-up must check wall-clock time");
  browser.dispatchEvent({ type: "visibilitychange" });
  assert.equal(status.expired, true);
  activity.initializeSessionActivity(token);
  browser.dispatchEvent({ type: "storage", key: activity.sessionActivityKey, storageArea: localStorage });
  assert.equal(status.warning, false, "Activity in another tab should clear the warning");
  now += sessionConfig.warningAfterMs;
  tick();
  assert.equal(status.warning, true);
  now += sessionConfig.logoutAfterMs;
  let expiredInput = false;
  const stopActivity = activity.trackSessionActivity(token, async () => assert.fail("Expired input notified"), () => {
    expiredInput = timeout.getSessionStatus(token).expired;
    return !expiredInput;
  });
  const previousActivity = activity.readSessionActivity(token).lastActivityAt;
  browser.dispatchEvent({ type: "click", isTrusted: true });
  assert.equal(expiredInput, true);
  assert.equal(activity.readSessionActivity(token).lastActivityAt, previousActivity, "First input must not revive an expired session");
  stopActivity();
  cleanup();
  assert.equal(listeners.size, 0);
  assert.equal(tick, undefined);

  // Reloading reads the stored deadline rather than starting a new one.
  assert.equal(timeout.getSessionStatus(token).expired, true);
  storage.delete(activity.sessionActivityKey);
  assert.equal(timeout.getSessionStatus(token).expired, true);
  activity.initializeSessionActivity(token);
  const jwtExpired = `header.${Buffer.from(JSON.stringify({ exp: 1 })).toString("base64url")}.signature`;
  activity.initializeSessionActivity(jwtExpired);
  assert.equal(timeout.getSessionStatus(jwtExpired).expired, true);

  const api = load(path.join(__dirname, "../src/api/authenticatedFetch.ts"));
  let unauthorized = 0;
  browser.addEventListener(api.sessionUnauthorizedEvent, () => { unauthorized++; });
  await api.authenticatedFetch("/api", { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(unauthorized, 1);
  storage.set("token", "new-session");
  await api.authenticatedFetch("/api", { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(unauthorized, 1, "Late 401 must not invalidate the new session");
  responseStatus = 503;
  await api.authenticatedFetch("/api", { headers: { Authorization: "Bearer new-session" } });
  assert.equal(unauthorized, 1, "Service errors must not cause logout");
  console.log("Session timeout tests passed: boundaries, wake-up, tabs, reload, expired input, JWT expiry, 401 isolation.");
}

run().catch(error => { console.error(error); process.exitCode = 1; });
