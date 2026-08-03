"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import styles from "./QrRetrait.module.css";

export function QrRetrait({
  lotId,
  typeDechet,
  pin,
  qrHash,
  volumeEstime,
  commune,
  quartier,
}: {
  lotId: string;
  typeDechet: string;
  pin: string;
  qrHash: string;
  volumeEstime: number | null;
  commune: string | null;
  quartier: string | null;
}) {
  // Payload embarqué dans le QR Code — vérifié côté serveur.
  const qrPayload = JSON.stringify({ lot: lotId, hash: qrHash });

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="warning" dot>
            Retrait en cours
          </Badge>
          <Badge tone="outline">{typeDechet}</Badge>
        </div>
        <h1>Validation du retrait</h1>
        <p className="muted">
          Le collecteur est sur place. Présentez-lui ce QR Code à scanner — ou
          dictez-lui le code PIN si son appareil photo ne fonctionne pas.
        </p>
      </div>

      <div className={styles.grid}>
        <Card elevated>
          <div className={styles.qrWrap}>
            <div className={styles.qrBox}>
              <QRCodeSVG
                value={qrPayload}
                size={220}
                bgColor="#f3eee1"
                fgColor="#14251b"
                level="M"
              />
            </div>
            <p className={styles.qrHint}>
              <Icon name="scan" size={16} />
              Le collecteur scanne ce code avec son application
            </p>
          </div>
        </Card>

        <Card>
          <div className={styles.pinSection}>
            <span className={styles.pinLabel}>Code PIN de secours</span>
            <div className={styles.pinDigits}>
              {pin.split("").map((d, i) => (
                <span key={i} className={styles.pinDigit}>
                  {d}
                </span>
              ))}
            </div>
            <p className={styles.pinHint}>
              À communiquer uniquement si le scan est impossible.
            </p>
          </div>

          <div className={styles.meta}>
            {volumeEstime != null && (
              <div className={styles.metaRow}>
                <Icon name="box" size={16} />
                <span>Volume estimé : ~{volumeEstime} kg</span>
              </div>
            )}
            {commune && (
              <div className={styles.metaRow}>
                <Icon name="location" size={16} />
                <span>
                  {commune}
                  {quartier ? ` · ${quartier}` : ""}
                </span>
              </div>
            )}
          </div>

          <div className={styles.securityNote}>
            <Icon name="shield" size={16} />
            <p>
              Après validation, le collecteur pèse le lot et vous devrez
              confirmer la collecte dans votre espace pour déclencher vos
              points.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
