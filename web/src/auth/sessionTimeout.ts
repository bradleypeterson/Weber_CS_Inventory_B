import { sessionConfig } from "../../../shared/sessionConfig";
import { readSessionActivity, sessionActivityKey } from "./sessionActivity";

export const sessionActivityEvent = "session-activity";

export function getSessionStatus(token: string, now = Date.now()) {
  const activity = readSessionActivity(token);
  let jwtExpiresAt = 0;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (Number.isFinite(payload.exp)) jwtExpiresAt = payload.exp * 1000;
  } catch { /* Invalid tokens require a new login. */ }
  if (!activity || now >= jwtExpiresAt || now - activity.lastActivityAt >= sessionConfig.logoutAfterMs) {
    return { expired: true, warning: false, remainingMs: 0 };
  }
  const idleMs = Math.max(0, now - activity.lastActivityAt);
  return {
    expired: false,
    warning: idleMs >= sessionConfig.warningAfterMs,
    remainingMs: sessionConfig.logoutAfterMs - idleMs
  };
}

export function watchSessionTimeout(token: string, onStatus: (status: ReturnType<typeof getSessionStatus>) => void) {
  function check() {
    if (localStorage.getItem("token") === token) onStatus(getSessionStatus(token));
  }
  function onStorage(event: StorageEvent) {
    if (event.storageArea === localStorage && (event.key === sessionActivityKey || event.key === null)) check();
  }
  check();
  const timer = window.setInterval(check, 1000);
  window.addEventListener("focus", check);
  window.addEventListener("pageshow", check);
  window.addEventListener("storage", onStorage);
  window.addEventListener(sessionActivityEvent, check);
  document.addEventListener("visibilitychange", check);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", check);
    window.removeEventListener("pageshow", check);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(sessionActivityEvent, check);
    document.removeEventListener("visibilitychange", check);
  };
}
