// Run with: node tests/session-activity.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/auth/sessionActivity.ts"), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function setup(sharedStorage) {
  let now = 100_000;
  let id = 0;
  const storage = sharedStorage ?? new Map([["token", "test-token"]]);
  const listeners = new Map();
  const timers = new Map();
  const context = {
    exports: {}, Date: { now: () => now },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    window: {
      addEventListener: (event, fn) => listeners.set(event, fn),
      removeEventListener: event => listeners.delete(event),
      setTimeout: (fn, delay) => { timers.set(++id, { fn, at: now + delay }); return id; },
      clearTimeout: key => timers.delete(key)
    }
  };
  vm.runInNewContext(code, context);
  const api = context.exports;
  if (!api.readSessionActivity("test-token")) api.initializeSessionActivity("test-token");
  return {
    api, storage, listeners, timers,
    event: (event, trusted = true) => listeners.get(event)?.({ isTrusted: trusted }),
    advance: async milliseconds => {
      now += milliseconds;
      for (const [key, timer] of [...timers]) {
        if (timer.at <= now) { timers.delete(key); timer.fn(); }
      }
      await Promise.resolve();
      await Promise.resolve();
    }
  };
}

async function run() {
  const env = setup();
  let notifications = 0;
  const cleanup = env.api.trackSessionActivity("test-token", async () => { notifications++; return true; });
  await env.advance(1000);
  env.event("click", false);
  assert.equal(env.api.readSessionActivity("test-token").lastActivityAt, 100_000);
  env.event("click");
  env.event("keydown");
  env.event("scroll");
  assert.equal(env.api.readSessionActivity("test-token").lastActivityAt, 101_000);
  assert.equal(env.timers.size, 1, "Repeated input should share one batch");
  await env.advance(14_000);
  assert.equal(notifications, 1);
  await env.advance(120_000);
  assert.equal(notifications, 1, "Idle tabs must not send keep-alives");
  assert.equal(env.api.readSessionActivity("another-token"), null);
  env.event("click");
  await env.advance(0);
  assert.equal(notifications, 2);
  cleanup();
  assert.equal(env.listeners.size, 0);
  assert.equal(env.timers.size, 0);

  const expired = setup();
  let expiredCalls = 0;
  expired.api.trackSessionActivity("test-token", async () => { expiredCalls++; return false; });
  await expired.advance(16_000);
  expired.event("click");
  await expired.advance(0);
  expired.event("keydown");
  await expired.advance(60_000);
  assert.equal(expiredCalls, 1, "Rejected sessions must stop sending activity");

  const logout = setup();
  let callsAfterLogout = 0;
  logout.api.trackSessionActivity("test-token", async () => { callsAfterLogout++; return true; });
  logout.event("click");
  logout.storage.delete("token");
  await logout.advance(16_000);
  assert.equal(callsAfterLogout, 0);

  const firstTab = setup();
  const secondTab = setup(firstTab.storage);
  let sharedNotifications = 0;
  firstTab.api.trackSessionActivity("test-token", async () => { sharedNotifications++; return true; });
  secondTab.api.trackSessionActivity("test-token", async () => { sharedNotifications++; return true; });
  await firstTab.advance(1000);
  await secondTab.advance(1000);
  firstTab.event("click");
  assert.equal(secondTab.api.readSessionActivity("test-token").lastActivityAt, 101_000);
  secondTab.event("keydown");
  await firstTab.advance(14_000);
  await secondTab.advance(14_000);
  assert.equal(sharedNotifications, 1, "Tabs should share the notification timestamp");
  console.log("Session activity tests passed: input, batching, idle, session isolation, cleanup, rejection, logout.");
}

run().catch(error => { console.error(error); process.exitCode = 1; });
