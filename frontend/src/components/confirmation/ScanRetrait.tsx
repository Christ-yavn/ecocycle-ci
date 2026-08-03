"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import styles from "./ScanRetrait.module.css";

// Déclaration minimale de l'API BarcodeDetector (pas encore dans lib.dom)
type BarcodeDetectorInstance = {
  detect: (
    source: CanvasImageSource,
  ) => Promise<Array<{ rawValue: string }>>;
};
type BarcodeDetectorCtor = new (options?: {
  formats: string[];
}) => BarcodeDetectorInstance;

type ScanState = "idle" | "scanning" | "scanned" | "unsupported" | "error";

export function ScanRetrait({
  lotId,
  typeDechet,
  volumeEstime,
  commune,
  quartier,
}: {
  lotId: string;
  typeDechet: string;
  volumeEstime: number | null;
  commune: string | null;
  quartier: string | null;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [qrHash, setQrHash] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [poidsReel, setPoidsReel] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Nettoyage caméra à la destruction
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startScanner() {
    setError(null);

    const Detector = (
      window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
    ).BarcodeDetector;

    if (!Detector) {
      setScanState("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new Detector({ formats: ["qr_code"] });
      setScanState("scanning");

      scanTimerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length === 0) return;

          const raw = codes[0].rawValue;
          const parsed = JSON.parse(raw) as { lot?: string; hash?: string };

          if (parsed.lot !== lotId || !parsed.hash) {
            setError("Ce QR Code ne correspond pas à ce lot.");
            return;
          }

          setQrHash(parsed.hash);
          setScanState("scanned");
          stopCamera();
        } catch {
          // Frame illisible ou QR non-JSON : on continue le scan
        }
      }, 600);
    } catch {
      setScanState("error");
      setError(
        "Caméra inaccessible. Autorisez l'accès ou utilisez le code PIN ci-dessous.",
      );
    }
  }

  async function handleValidate() {
    setError(null);

    const poids = parseFloat(poidsReel.replace(",", "."));
    if (!poids || poids <= 0) {
      setError("Saisissez le poids réel pesé (kg).");
      return;
    }

    if (!qrHash && !/^\d{4}$/.test(pin)) {
      setError("Scannez le QR Code ou saisissez le PIN à 4 chiffres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/lots/${lotId}/valider-retrait`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrHash: qrHash ?? undefined,
          pin: qrHash ? undefined : pin,
          poidsReel: poids,
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/collecteur/tournees"), 2000);
      } else {
        setError(data.error ?? "Validation échouée.");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>
          <Icon name="check" size={32} />
        </div>
        <h2 className="font-fraunces">Retrait validé</h2>
        <p className="muted">
          Le lot est marqué comme collecté. Le producteur confirmera de son
          côté pour finaliser la transaction.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="warning" dot>
            Validation retrait
          </Badge>
          <Badge tone="outline">{typeDechet}</Badge>
        </div>
        <h1>Scanner le QR Code du producteur</h1>
        <p className="muted">
          {commune ?? ""}
          {quartier ? ` · ${quartier}` : ""}
          {volumeEstime ? ` — ~${volumeEstime} kg estimés` : ""}
        </p>
      </div>

      <div className={styles.grid}>
        {/* --- Zone scan --- */}
        <Card elevated>
          <div className={styles.scanZone}>
            {scanState === "scanning" ? (
              <div className={styles.videoWrap}>
                <video ref={videoRef} className={styles.video} muted playsInline />
                <div className={styles.scanFrame} />
              </div>
            ) : scanState === "scanned" ? (
              <div className={styles.scannedBox}>
                <Icon name="check" size={40} />
                <p>QR Code vérifié</p>
              </div>
            ) : (
              <div className={styles.scanPlaceholder}>
                <Icon name="scan" size={40} />
                <p>
                  {scanState === "unsupported"
                    ? "Le scan n'est pas supporté par ce navigateur. Utilisez le PIN."
                    : "Activez la caméra pour scanner le QR Code chez le producteur."}
                </p>
                {scanState !== "unsupported" && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={startScanner}
                  >
                    <Icon name="camera" size={16} />
                    Activer la caméra
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* --- PIN fallback + poids --- */}
        <Card>
          {!qrHash && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pin">
                Code PIN (si scan impossible)
              </label>
              <input
                id="pin"
                type="text"
                inputMode="numeric"
                maxLength={4}
                className={styles.pinInput}
                placeholder="••••"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="poids">
              Poids réel pesé (kg)
            </label>
            <input
              id="poids"
              type="text"
              inputMode="decimal"
              className={styles.input}
              placeholder={volumeEstime ? `~${volumeEstime}` : "Ex : 25"}
              value={poidsReel}
              onChange={(e) => setPoidsReel(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="note">
              Note (optionnel)
            </label>
            <input
              id="note"
              type="text"
              className={styles.input}
              placeholder="État réel du lot, remarque…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={handleValidate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Validation en cours…
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                Valider le retrait
              </>
            )}
          </button>
        </Card>
      </div>
    </>
  );
}
