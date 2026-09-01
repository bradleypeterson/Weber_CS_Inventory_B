import styles from "./IconInput.module.css";

type CustomInputProps = {
  width?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  icon?: JSX.Element;
};

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & CustomInputProps;

export function IconInput(props: Props) {
  return (
    <div className={styles.container} style={{ ...props.style, width: props.width }}>
      <div className={styles.iconInputContainer}>
        <i className={styles.icon}>{props.icon}</i>
        <input
          type="text"
          className={styles.input}
          {...props}
          placeholder={props.placeholder}
          value={props.value}
          onChange={(e) => props.onChange && props.onChange(e.target.value)}
        ></input>
      </div>
    </div>
  );
}
