import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Tone = "forest" | "amber" | "signal" | "rust" | "paper";

const toneClass: Record<Tone, string> = {
  forest: styles.forest,
  amber: styles.amber,
  signal: styles.signal,
  rust: styles.rust,
  paper: styles.paper,
};

export function Badge({
  children,
  tone = "forest",
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
