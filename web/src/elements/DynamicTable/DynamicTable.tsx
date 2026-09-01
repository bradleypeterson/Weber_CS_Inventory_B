import { CSSProperties, isValidElement, ReactNode } from "react";
import styles from "./DynamicTable.module.css";

interface BaseColumn {
  label: string;
  align?: "left" | "center" | "right";
}

export interface DataColumn<T, K extends keyof T = keyof T> extends BaseColumn {
  dataIndex: K;
}

interface RenderColumn<T> extends BaseColumn {
  render: (record: T) => ReactNode;
}

export type Column<T> = DataColumn<T, keyof T> | RenderColumn<T>;

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  width?: string;
  style?: CSSProperties;
};

export function DynamicTable<T>(props: Props<T>) {
  function renderValue(value: T[keyof T]): ReactNode {
    if (typeof value === "string" || typeof value === "number") return value;
    if (typeof value === "boolean") return value ? "true" : "false";
    if (isValidElement(value)) return value;
    return "";
  }

  return (
    <table className={styles.table} width={props.width} style={props.style}>
      <thead className={styles.thead}>
        <tr>
          {props.columns.map((column, i) => {
            const align =
              column.align === "left" ? styles.left : column.align === "right" ? styles.right : styles.center;
            return (
              <th key={i} className={align}>
                {column.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className={styles.tbody}>
        {props.data.map((row, i) => (
          <tr key={i}>
            {props.columns.map((col, j) => {
              const align = col.align === "left" ? styles.left : col.align === "right" ? styles.right : styles.center;

              if ("dataIndex" in col)
                return (
                  <td key={j} className={align}>
                    {renderValue(row[col.dataIndex])}
                  </td>
                );

              return (
                <td key={j} className={align}>
                  {col.render(row)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
