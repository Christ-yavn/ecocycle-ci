import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./layout.module.css";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={styles.authLayout}>
      <Link href="/" className={styles.brand}>
        <span className={styles.brandDot} />
        EcoCycle CI
      </Link>
      <div className={styles.card}>{children}</div>
      <Link href="/" className={styles.backLink}>
        ← Retour à l&apos;accueil
      </Link>
    </div>
  );
}
