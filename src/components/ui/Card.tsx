import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Card.module.css";

export function Card({
  children,
  title,
  action,
  actionHref,
  elevated = true,
  className,
}: {
  children: ReactNode;
  title?: string;
  action?: string;
  actionHref?: string;
  elevated?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`${styles.container} ${elevated ? styles.elevated : ""} ${className ?? ""}`}
    >
      {(title || action) && (
        <header className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {action && actionHref && (
            <Link href={actionHref} className={styles.action}>
              {action}
            </Link>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
