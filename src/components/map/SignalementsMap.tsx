"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SignalementMapItem } from "@/types/map";
import styles from "./MapView.module.css";

const ABIDJAN_CENTER: [number, number] = [5.3097, -4.0122];

const STATUS_COLOR: Record<string, string> = {
  nouveau: "#b4522f",
  pris_en_charge: "#d9a441",
  resolu: "#3fa34d",
};

const STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  pris_en_charge: "Pris en charge",
  resolu: "Résolu",
};

export function SignalementsMap({
  signalements,
  onUpdateStatus,
}: {
  signalements: SignalementMapItem[];
  onUpdateStatus?: (id: string, status: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: ABIDJAN_CENTER,
      zoom: 12,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = new Map();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = new Map();

    signalements.forEach((s) => {
      if (s.latitude == null || s.longitude == null) return;

      const color = STATUS_COLOR[s.status] ?? STATUS_COLOR.nouveau;
      const label = STATUS_LABEL[s.status] ?? s.status;

      const icon = L.divIcon({
        className: styles.markerWrap,
        html: `<div style="
          width:24px;height:24px;
          background:${color};
          border-radius:50%;
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([s.latitude, s.longitude], { icon }).addTo(map);

      const dateStr = new Date(s.dateSignalement).toLocaleDateString("fr-FR");
      const desc = s.description ?? "Aucune description";

      const popupHtml = `
        <div style="font-family:Manrope,sans-serif;min-width:220px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:${color};margin-bottom:4px;">
            ${label} · ${dateStr}
          </div>
          <div style="font-size:0.85rem;color:#14251b;margin-bottom:8px;">${desc}</div>
          ${s.quartier ? `<div style="font-size:0.75rem;color:#6b7280;margin-bottom:8px;">${s.commune ?? ""} ${s.quartier}</div>` : ""}
          ${
            onUpdateStatus && s.status !== "resolu"
              ? s.status === "nouveau"
                ? `<button id="sig-${s.id}" data-action="pris_en_charge" style="background:#d9a441;color:#14251b;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.8rem;font-weight:600;width:100%;margin-bottom:4px;">Prendre en charge</button>
                   <button id="sig-resolve-${s.id}" data-action="resolu" style="background:#3fa34d;color:#0d1f16;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.8rem;font-weight:600;width:100%;">Marquer résolu</button>`
                : `<button id="sig-${s.id}" data-action="resolu" style="background:#3fa34d;color:#0d1f16;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.8rem;font-weight:600;width:100%;">Marquer résolu</button>`
              : ""
          }
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        if (onUpdateStatus) {
          const btn = document.getElementById(`sig-${s.id}`);
          const btnResolve = document.getElementById(`sig-resolve-${s.id}`);
          if (btn) {
            btn.onclick = () => {
              const action = btn.getAttribute("data-action") ?? "pris_en_charge";
              onUpdateStatus(s.id, action);
              marker.closePopup();
            };
          }
          if (btnResolve) {
            btnResolve.onclick = () => {
              onUpdateStatus(s.id, "resolu");
              marker.closePopup();
            };
          }
        }
      });

      markersRef.current.set(s.id, marker);
    });

    if (signalements.length > 0) {
      const bounds = L.latLngBounds(
        signalements
          .filter((s) => s.latitude != null && s.longitude != null)
          .map((s) => [s.latitude!, s.longitude!] as [number, number]),
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }
  }, [signalements, ready, onUpdateStatus]);

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
      {signalements.length === 0 && (
        <div className={styles.emptyMap}>
          <span className="font-mono">Aucun signalement sur la commune</span>
        </div>
      )}
    </div>
  );
}
