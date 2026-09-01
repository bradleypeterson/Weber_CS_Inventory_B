import styles from "./MagicWordOverlay.module.css";

type MagicWordOverlayProps = {
  phrase: string;
};

export function MagicWordOverlay({ phrase }: MagicWordOverlayProps) {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.sprite} />
      <div className={styles.caption}>{phrase}</div>
    </div>
  );
}
