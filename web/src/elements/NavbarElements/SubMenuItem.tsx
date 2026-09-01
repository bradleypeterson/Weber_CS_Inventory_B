import { CaretRight } from "@phosphor-icons/react";
import styles from "./SubMenuItem.module.css";

type Props = {
  title: string;
  onClick: () => void;
  active?: boolean;
};

export function SubMenuItem(props: Props) {
  return (
    <button onClick={props.onClick} className={`${styles.item} ${props.active ? styles.active : ""}`}>
      <span>{props.title}</span>
      {props.active && <CaretRight />}
    </button>
  );
}
