import { useMemo } from "react";
import styles from "./IconButton.module.css";
type CustomButtonProps = {
  variant?: "primary" | "secondary";
  size?: "small" | "normal";
  icon?: JSX.Element;
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & CustomButtonProps;

export function IconButton(props: Props) {
  const classNames = useMemo(() => {
    const classNames = [styles.button];
    if (props.variant === "primary") classNames.push(styles.primary);
    if (props.variant === "secondary") classNames.push(styles.secondary);
    if (props.size === "small") classNames.push(styles.small);
    if (props.icon) classNames.push(styles.icon);
    return classNames;
  }, [props.variant, props.size, props.icon]);

  return (
    <button className={classNames.join(" ")} {...props}>
      {props.icon && props.icon}
    </button>
  );
}
