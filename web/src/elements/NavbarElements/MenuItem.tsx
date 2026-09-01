import { CaretDown } from "@phosphor-icons/react";
import { ReactElement, ReactNode, useEffect, useRef, useState } from "react";
import styles from "./MenuItem.module.css";

type Props = {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  active: boolean;
  icon: ReactNode;
  title: string;
  children?: ReactElement[] | ReactElement;
};
export function MenuItem(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.collapsed === true) setExpanded(false);
  }, [props.collapsed]);

  useEffect(() => {
    if (expanded && contentRef.current) {
      setHeight(contentRef.current.scrollHeight); // Measure content height
    } else {
      setHeight(0);
    }
  }, [expanded]);

  function handleMenuItemClick() {
    if (props.collapsed) {
      props.setCollapsed(false);
      setExpanded(true);
    } else {
      setExpanded((cur) => !cur);
    }
  }

  return (
    <div className={styles.menu}>
      <button
        className={`${styles.menuButton} ${props.collapsed ? styles.collapsed : ""} ${props.active ? styles.active : ""}`}
        onClick={handleMenuItemClick}
      >
        <span>
          <span className={styles.icon}>{props.icon}</span>
          {!props.collapsed && props.title}
        </span>
        {!props.collapsed && (
          <span>
            <CaretDown style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "0.2s ease-in-out" }} />{" "}
          </span>
        )}
      </button>
      <div ref={contentRef} className={`${styles.content}`} style={{ height: `${height}px` }}>
        {props.children}
      </div>
    </div>
  );
}
