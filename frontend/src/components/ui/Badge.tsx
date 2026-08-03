import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Tone = "primary" | "warning" | "success" | "danger" | "outline";

const toneClass: Record<Tone, string> = {
  primary: styles.primary,
  warning: styles.warning,
  success: styles.success,
  danger: styles.danger,
  outline: styles.outline,
};

export function Badge({
  children,
  tone = "primary",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span className={`${styles.badge} ${toneClass[tone]}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
