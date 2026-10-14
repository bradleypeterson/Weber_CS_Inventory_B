export const sessionActivityKey = "sessionActivity";
const notificationIntervalMs = 15_000;

type ActivityRecord = {
  token: string;
  lastActivityAt: number;
  lastNotifiedAt: number;
};

export function readSessionActivity(token: string): ActivityRecord | null {
  try {
    const record = JSON.parse(localStorage.getItem(sessionActivityKey) ?? "null");
    if (record?.token !== token || !Number.isFinite(record.lastActivityAt) ||
        !Number.isFinite(record.lastNotifiedAt)) return null;
    return record;
  } catch {
    return null;
  }
}

export function initializeSessionActivity(token: string) {
  const now = Date.now();
  localStorage.setItem(sessionActivityKey, JSON.stringify({ token, lastActivityAt: now, lastNotifiedAt: now }));
}

// Listen only for user actions. API requests, focus, and page loads are not activity.
export function trackSessionActivity(
  token: string,
  notify: () => Promise<boolean>,
  beforeActivity: () => boolean = () => true,
  afterActivity: () => void = () => {}
) {
  let timer: number | undefined;
  let sending = false;
  let stopped = false;

  async function flush() {
    timer = undefined;
    const record = readSessionActivity(token);
    if (stopped || sending || localStorage.getItem("token") !== token || !record) return;
    const now = Date.now();
    // Do not turn retries of old activity into a background keep-alive.
    if (record.lastActivityAt <= record.lastNotifiedAt || now - record.lastActivityAt > notificationIntervalMs * 2) return;
    const wait = notificationIntervalMs - (now - record.lastNotifiedAt);
    if (wait > 0) {
      timer = window.setTimeout(() => { void flush(); }, wait);
      return;
    }
    sending = true;
    try {
      if (!await notify()) {
        stopped = true;
        return;
      }
      const current = readSessionActivity(token);
      if (!stopped && localStorage.getItem("token") === token && current) {
        localStorage.setItem(sessionActivityKey, JSON.stringify({
          ...current, lastNotifiedAt: Math.max(current.lastNotifiedAt, now)
        }));
      }
    } catch {
      // A later user action or the pending batch can retry a network failure.
    } finally {
      sending = false;
      const current = readSessionActivity(token);
      if (!stopped && current && current.lastActivityAt > current.lastNotifiedAt) {
        timer = window.setTimeout(() => { void flush(); }, notificationIntervalMs);
      }
    }
  }

  function onActivity(event: Event) {
    if (!event.isTrusted || stopped || localStorage.getItem("token") !== token) return;
    // Check before recording input, especially the first input after a long sleep.
    if (!beforeActivity()) return;
    const current = readSessionActivity(token);
    localStorage.setItem(sessionActivityKey, JSON.stringify({
      token,
      lastActivityAt: Date.now(),
      lastNotifiedAt: current?.lastNotifiedAt ?? 0
    }));
    afterActivity();
    if (timer === undefined && !sending) void flush();
  }

  const events = ["click", "keydown", "scroll"];
  events.forEach(event => window.addEventListener(event, onActivity, { capture: true, passive: true }));
  return () => {
    stopped = true;
    if (timer !== undefined) window.clearTimeout(timer);
    events.forEach(event => window.removeEventListener(event, onActivity, true));
  };
}
