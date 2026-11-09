export const sessionUnauthorizedEvent = "session-unauthorized";
let sessionRequests = new AbortController();

export function cancelSessionRequests() {
  const previous = sessionRequests;
  sessionRequests = new AbortController();
  previous.abort();
}

// Match the rejected request's token so a late 401 cannot log out a new session.
export async function authenticatedFetch(url: string, options: Omit<RequestInit, "signal">) {
  const authorization = new Headers(options.headers).get("Authorization");
  const token = authorization?.replace(/^Bearer /, "");
  const { signal } = sessionRequests;
  const response = await fetch(url, { ...options, signal, cache: "no-store" });
  if (signal.aborted) throw new DOMException("The session has ended.", "AbortError");
  if (response.status === 401 && token && localStorage.getItem("token") === token) {
    window.dispatchEvent(new CustomEvent(sessionUnauthorizedEvent, { detail: token }));
  }
  return response;
}
