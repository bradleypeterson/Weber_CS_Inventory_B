import { ReactNode, useCallback, useEffect, useState } from "react";
import { sessionActivityKey, trackSessionActivity } from "../auth/sessionActivity";
import { getSessionStatus, sessionActivityEvent, watchSessionTimeout } from "../auth/sessionTimeout";
import { authenticatedFetch, sessionUnauthorizedEvent } from "../api/authenticatedFetch";
import { Button } from "../elements/Button/Button";
import styles from "./SessionWarning.module.css";
import { clearPersistedFilters } from "../filters/storage";
import { clearAssetSearchState } from "../state/assetSearchStorage";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<number[]>([]);
  const [token, setToken] = useState<string>("");
  const [personID, setPersonID] = useState<number>(0);
  const [warningMinutes, setWarningMinutes] = useState<number | null>(null);

  useEffect(() => {
    function restoreAuth() {
      const token = localStorage.getItem("token");
      let permissions: number[] = [];
      try {
        const saved = JSON.parse(localStorage.getItem("permissions") ?? "[]");
        if (Array.isArray(saved) && saved.every(value => typeof value === "number")) permissions = saved;
      } catch { /* Ignore invalid persisted permissions. */ }
      const personID = Number(localStorage.getItem("personID"));
      setToken(token ?? "");
      setPermissions(token ? permissions : []);
      setPersonID(token && Number.isFinite(personID) ? personID : 0);
    }
    restoreAuth();
    // Storage events run after the other tab has finished saving auth fields.
    function onStorage(event: StorageEvent) {
      if (event.storageArea === localStorage &&
          (event.key === null || ["token", "permissions", "personID"].includes(event.key))) {
        restoreAuth();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = useCallback(() => {
    clearAssetSearchState();

    const currentToken = localStorage.getItem("token");
    if (currentToken) {
      void fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}` },
        credentials: "include",
        keepalive: true
      }).catch(() => {
        // Local logout still completes if the API is unavailable.
      });
    }

    setPermissions([]);
    setToken("");
    setPersonID(0);
    setWarningMinutes(null);
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    localStorage.removeItem("personID");
    localStorage.removeItem(sessionActivityKey);
    clearPersistedFilters();
  }, []);

  const notifyActivity = useCallback(async () => {
    const result = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/auth/activity`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    });
    if (result.status === 401) return false;
    if (!result.ok) throw new Error("Activity notification failed");
    return true;
  }, [token]);

  useEffect(() => {
    if (!token) {
      setWarningMinutes(null);
      return;
    }
    function onUnauthorized(event: Event) {
      if ((event as CustomEvent<string>).detail === token && localStorage.getItem("token") === token) logout();
    }
    window.addEventListener(sessionUnauthorizedEvent, onUnauthorized);
    const stopTimeout = watchSessionTimeout(token, status => {
      if (status.expired) logout();
      else setWarningMinutes(status.warning ? Math.ceil(status.remainingMs / 60_000) : null);
    });
    const stopActivity = trackSessionActivity(token, notifyActivity, () => {
      if (getSessionStatus(token).expired) {
        logout();
        return false;
      }
      return true;
    }, () => window.dispatchEvent(new Event(sessionActivityEvent)));
    return () => {
      stopTimeout();
      stopActivity();
      window.removeEventListener(sessionUnauthorizedEvent, onUnauthorized);
    };
  }, [token, logout, notifyActivity]);

  function continueSession() {
    if (!token || localStorage.getItem("token") !== token) return;
    if (getSessionStatus(token).expired) {
      logout();
      return;
    }
    // Input capture already records the click/key; explicitly confirm with the API.
    setWarningMinutes(null);
    void notifyActivity().catch(() => { /* Later user input retries a network failure. */ });
  }

  return (
    <AuthContext.Provider value={{ permissions, setPermissions, token, setToken, personID, setPersonID, logout }}>
      {children}
      {token && warningMinutes !== null && (
        <section className={styles.warning} role="alert" aria-labelledby="session-warning-title">
          <h2 id="session-warning-title">Are you still using the app?</h2>
          <p>You have been inactive. You will be logged out in {warningMinutes} minute(s).</p>
          <Button variant="primary" onClick={continueSession}>Continue session</Button>
        </section>
      )}
    </AuthContext.Provider>
  );
}
