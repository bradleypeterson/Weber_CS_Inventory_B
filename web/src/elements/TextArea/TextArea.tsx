import { useMemo } from "react";
import styles from "./TextArea.module.css";

type CustomTextAreaProps = {
  width?: string;
  height?: string;
  placeholder?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
};

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & CustomTextAreaProps;

export function TextArea(props: Props) {
  const { width, height, label, onChange, ...rest } = props;

  const classNames = useMemo(() => {
    const classNames = [styles.textarea];
    return classNames;
  }, []);

  return (
    <div className={styles.container} style={{ width }}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea
        {...rest}
        className={classNames.join(" ")}
        style={{ height }}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  );
}
