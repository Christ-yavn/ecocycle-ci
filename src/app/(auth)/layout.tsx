import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./layout.module.css";

export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={styles.authPage}>
      <div className={styles.brandPanel}>
        <div className={styles.brandPanelInner}>
          <Link href="/" className={styles.brandLogo}>
            <span className={styles.brandDot} />
            EcoCycle CI
          </Link>

          <div className={styles.brandContent}>
            <h2 className={styles.brandTitle}>
              La gestion circulaire
              <br />
              des déchets à Abidjan
            </h2>
            <p className={styles.brandDesc}>
              Du tri à la source par les producteurs jusqu{"'"}à la matière
              première recyclée — avec un système de double confirmation
              qui garantit la traçabilité.
            </p>

            <div className={styles.brandFeatures}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>◐</span>
                <div>
                  <strong>6 acteurs connectés</strong>
                  <span>Producteurs, collecteurs, recycleurs, acheteurs, mairies, citoyens</span>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>◓</span>
                <div>
                  <strong>IA de reconnaissance</strong>
                  <span>YOLOv8 analyse vos déchets en temps réel</span>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>◒</span>
                <div>
                  <strong>Gamification & points</strong>
                  <span>Récompenses automatiques pour les producteurs</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.brandFooter}>
            EcoCycle CI · MVP Abidjan · v0.1
          </div>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formPanelInner}>
          {children}
        </div>
        <Link href="/" className={styles.backLink}>
          ← Retour à l{"'"}accueil
        </Link>
      </div>
    </div>
  );
}