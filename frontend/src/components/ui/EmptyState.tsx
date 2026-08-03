import type { ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./EmptyState.module.css";

export function EmptyState({
  icon = "box",
  title,
  children,
  action,
}: {
  icon?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.iconWrap}>
        <Icon name={icon} size={26} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {children && <p className={styles.text}>{children}</p>}
      {action}
    </div>
  );
}
