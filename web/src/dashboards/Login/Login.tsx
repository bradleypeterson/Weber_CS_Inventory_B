import { useEffect, useRef, useState } from "react";
import { login } from "../../api/auth";
import { Button } from "../../elements/Button/Button";
import { LabelInput } from "../../elements/LabelInput/LabelInput";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import { MAGIC_WORD_PHRASE, playMagicWordEasterEgg } from "./easterEgg";
import styles from "./Login.module.css";
import { MagicWordOverlay } from "./MagicWordOverlay";

export function Login() {
  const [wNumber, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showMagicWordOverlay, setShowMagicWordOverlay] = useState(false);
  const [magicWordOverlayRunId, setMagicWordOverlayRunId] = useState(0);
  const hideMagicWordTimeoutRef = useRef<number | null>(null);
  const linkTo = useLinkTo();
  const auth = useAuth();

  useEffect(() => {
    return () => {
      if (hideMagicWordTimeoutRef.current) window.clearTimeout(hideMagicWordTimeoutRef.current);
    };
  }, []);

  function triggerMagicWord() {
    if (hideMagicWordTimeoutRef.current) window.clearTimeout(hideMagicWordTimeoutRef.current);
    setMagicWordOverlayRunId((current) => current + 1);
    setShowMagicWordOverlay(true);
    hideMagicWordTimeoutRef.current = window.setTimeout(() => setShowMagicWordOverlay(false), 2800);
    void playMagicWordEasterEgg();
  }

  async function handleSubmit() {
    try {
      const result = await login(wNumber, password);
      if (result.status === "success") {
        setError("");
        setShowMagicWordOverlay(false);
        await new Promise((res) => {
          auth.setToken(result.data.token);
          auth.setPermissions(result.data.permissions);
          auth.setPersonID(result.data.personID);
          setTimeout(res, 100);
        });
        linkTo("Search", ["Assets"]);
      } else {
        setError(result.error.message);
        triggerMagicWord();
      }
    } catch (e) {
      console.error("Login failed unexpectedly:", e);
      setError("Login request failed");
      triggerMagicWord();
    }
  }

  return (
    <form
      className={styles.loginBox}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      {showMagicWordOverlay && <MagicWordOverlay key={magicWordOverlayRunId} phrase={MAGIC_WORD_PHRASE} />}
      <h1 className={styles.title}>Login</h1>
      {error && <span style={{ color: "red" }}>{error}</span>}
      <LabelInput
        label="W Number"
        placeholder="enter your W number"
        width="100%"
        value={wNumber}
        onChange={(val) => setUsername(val)}
      />
      <LabelInput
        label="Password"
        placeholder="enter your password"
        type="password"
        width="100%"
        value={password}
        onChange={(val) => setPassword(val)}
      />
      <Button variant="primary" type="submit">
        Submit
      </Button>
    </form>
  );
}

export default Login;
