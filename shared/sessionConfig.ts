// Shared by the API and web app. Durations are measured from the last user activity.
// Keep warningAfterMinutes shorter than logoutAfterMinutes.
const warningAfterMinutes = 60;
const logoutAfterMinutes = 120;

const millisecondsPerMinute = 60_000;

export const sessionConfig = {
  warningAfterMs: warningAfterMinutes * millisecondsPerMinute,
  logoutAfterMs: logoutAfterMinutes * millisecondsPerMinute
} as const;
