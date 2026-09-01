import { useEffect, useMemo, useRef } from "react";
import styles from "./Checkbox.module.css";

type Props = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  color?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">;

export function Checkbox(props: Props) {
  const { checked, onChange, label, ...rest } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  const classNames = useMemo(() => {
    const classNames = [styles.checkbox];
    return classNames;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  useEffect(
    function updateColor() {
      if (props.color && containerRef.current) {
        containerRef.current.style.setProperty("--checkbox-color", props.color);
      }
    },
    [props.color]
  );

  return (
    <div className={styles.container} ref={containerRef}>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" className={classNames.join(" ")} checked={checked} onChange={handleChange} {...rest} />
        {label && <span className={styles.label}>{label}</span>}
      </label>
    </div>
  );
}
