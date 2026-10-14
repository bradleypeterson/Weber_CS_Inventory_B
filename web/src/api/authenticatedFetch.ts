export const sessionUnauthorizedEvent = "session-unauthorized";

// Match the rejected request's token so a late 401 cannot log out a new session.
export async function authenticatedFetch(url: string, options: RequestInit) {
  const authorization = new Headers(options.headers).get("Authorization");
  const token = authorization?.replace(/^Bearer /, "");
  const response = await fetch(url, options);
  if (response.status === 401 && token && localStorage.getItem("token") === token) {
    window.dispatchEvent(new CustomEvent(sessionUnauthorizedEvent, { detail: token }));
  }
  return response;
}
