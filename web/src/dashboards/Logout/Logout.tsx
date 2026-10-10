import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../elements/Button/Button";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";

export function Logout() {
  const linkTo = useLinkTo();
  const navigate = useNavigate();
  const auth = useAuth();

  const handleConfirmLogout = useCallback(() => {
    auth.logout();
    linkTo("login");
  }, [auth, linkTo]);

  const handleCancel = useCallback(() => {
    // Try to return user to where they were; fallback to Assets Search.
    const canGoBack = typeof window !== "undefined" && window.history.length > 1;
    if (canGoBack) navigate(-1);
    else linkTo("Search", ["Assets"]);
  }, [navigate, linkTo]);

  return (
    <main style={{ padding: "2rem", display: "grid", gap: "1rem", justifyItems: "center" }}>
      <h2 style={{ margin: 0 }}>Log out?</h2>
      <div>Are you sure you want to log out?</div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirmLogout}>
          Log out
        </Button>
      </div>
    </main>
  );
}

export default Logout;