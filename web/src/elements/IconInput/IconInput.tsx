import React, { forwardRef } from "react";
import styles from "./IconInput.module.css";

type CustomInputProps = {
  width?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  icon?: JSX.Element;
};

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & CustomInputProps;

export const IconInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { style, width, icon, value, onChange, ...rest } = props;
  return (
    <div className={styles.container} style={{ ...style, width }}>
      <div className={styles.iconInputContainer}>
        <i className={styles.icon}>{icon}</i>
        <input
          type="text"
          className={styles.input}
          {...rest}
          placeholder={props.placeholder}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          ref={ref}
        ></input>
      </div>
    </div>
  );
});