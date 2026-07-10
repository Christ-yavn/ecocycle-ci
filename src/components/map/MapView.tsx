"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { getMarkerConfig, type MapLot } from "@/types/map";
import styles from "./MapView.module.css";

// Centre par défaut : Abidjan (Plateau)
const ABIDJAN_CENTER: [number, number] = [5.3097, -4.0122];
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

type Coords = { lat: number; lng: number };

type RouteInfo = {
  distanceKm: number;
  durationMin: number;
  stops: number;
};

export function MapView({
  lots,
  onReserve,
  reservedIds = [],
}: {
  lots: MapLot[];
  onReserve?: (lotId: string) => void;
  reservedIds?: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userPos, setUserPos] = useState<Coords | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // --- Init map ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: ABIDJAN_CENTER,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    // Tuiles LOWRES pour 2G/3G (CartoDB Positron — léger, ~40ko/carte)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = new Map();
      routingControlRef.current = null;
    };
  }, []);

  // --- Markers ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    lots.forEach((lot) => {
      if (lot.latitude == null || lot.longitude == null) return;

      const config = getMarkerConfig(lot.typeDechet);
      const isReserved = reservedIds.includes(lot.id);
      const isSelected = selectedIds.includes(lot.id);

      // Créer une icône SVG custom avec la couleur du type
      const size = lot.volumeIa && lot.volumeIa > 50 ? 34 : lot.volumeIa && lot.volumeIa > 20 ? 28 : 24;
      const opacity = isReserved ? 0.4 : 1;
      const ringColor = isSelected ? "#d9a441" : "#ffffff";
      const ringWidth = isSelected ? 4 : 2;

      const icon = L.divIcon({
        className: styles.markerWrap,
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${config.color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:${ringWidth}px solid ${ringColor};
          opacity:${opacity};
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
      });

      const marker = L.marker([lot.latitude, lot.longitude], { icon }).addTo(map);

      const scoreStars = lot.scoreTri
        ? "★".repeat(lot.scoreTri) + "☆".repeat(5 - lot.scoreTri)
        : "—";
      const volLabel = lot.weightReal
        ? `${lot.weightReal} kg`
        : lot.volumeIa
          ? `~${lot.volumeIa} kg`
          : "Volume inconnu";
      const statusLabel = isReserved ? "Réservé" : "Disponible";

      const popupHtml = `
        <div style="font-family:Manrope,sans-serif;min-width:200px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:#2c3b31;margin-bottom:4px;">
            ${config.label} · ${statusLabel}
          </div>
          <div style="font-family:Fraunces,serif;font-weight:700;font-size:1rem;margin-bottom:4px;">${volLabel}</div>
          <div style="font-size:0.8rem;color:#2c3b31;margin-bottom:4px;">Tri : ${scoreStars}</div>
          ${lot.commune ? `<div style="font-size:0.75rem;color:#6b7280;margin-bottom:8px;">${lot.commune}${lot.quartier ? " · " + lot.quartier : ""}</div>` : ""}
          ${
            !isReserved && onReserve
              ? `<button id="reserve-${lot.id}" style="
                  background:#14251b;color:#f3eee1;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.8rem;font-weight:600;width:100%;
                ">Réserver ce lot</button>`
              : isReserved
                ? `<div style="text-align:center;font-size:0.75rem;color:#b4522f;font-weight:600;">Lot réservé</div>`
                : ""
          }
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        if (!isReserved && onReserve) {
          const btn = document.getElementById(`reserve-${lot.id}`);
          if (btn) {
            btn.onclick = () => {
              onReserve(lot.id);
              marker.closePopup();
            };
          }
        }
      });

      marker.on("click", () => {
        setSelectedIds((prev) =>
          prev.includes(lot.id)
            ? prev.filter((id) => id !== lot.id)
            : [...prev, lot.id],
        );
      });

      markersRef.current.set(lot.id, marker);
    });
  }, [lots, mapReady, selectedIds, reservedIds, onReserve]);

  // --- Géolocalisation ---
  const locateUser = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(c);
        const map = mapRef.current;
        if (!map) return;

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([c.lat, c.lng]);
        } else {
          const userIcon = L.divIcon({
            className: styles.userMarker,
            html: `<div style="
              width:20px;height:20px;background:#3fa34d;border:3px solid #fff;border-radius:50%;
              box-shadow:0 0 0 6px rgba(63,163,77,0.25);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          userMarkerRef.current = L.marker([c.lat, c.lng], {
            icon: userIcon,
          }).addTo(map);
          userMarkerRef.current.bindPopup("Ma position");
        }

        map.setView([c.lat, c.lng], 15);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  // --- Calcul de l'itinéraire via OSRM ---
  const calculateRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || selectedIds.length === 0) return;

    // Construire les waypoints : position user + lots sélectionnés
    const selectedLots = lots.filter((l) => selectedIds.includes(l.id));
    const validLots = selectedLots.filter(
      (l) => l.latitude != null && l.longitude != null,
    );
    if (validLots.length === 0) return;

    // Point de départ : position user ou centre Abidjan
    const start: Coords = userPos ?? { lat: ABIDJAN_CENTER[0], lng: ABIDJAN_CENTER[1] };

    // Si on a déjà un control, le supprimer
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Waypoints pour leaflet-routing-machine
    const waypoints: L.LatLng[] = [
      L.latLng(start.lat, start.lng),
      ...validLots.map((l) => L.latLng(l.latitude!, l.longitude!)),
    ];

    try {
      const control = L.Routing.control({
        waypoints,
        router: L.Routing.osrmv1({
          serviceUrl: OSRM_URL,
          profile: "driving",
        }),
        formatter: L.Routing.formatter({
          language: "fr",
        } as L.Routing.FormatterOptions),
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [
            { color: "#3fa34d", weight: 6, opacity: 0.8 },
            { color: "#0d1f16", weight: 2, opacity: 0.5 },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        } as L.Routing.LineOptions,
        createMarker: () => null,
      } as unknown as L.Routing.RoutingControlOptions);

      control.addTo(map);
      routingControlRef.current = control;

      // Calculer aussi via fetch direct pour les infos (distance/temps)
      const coordsStr = [
        `${start.lng},${start.lat}`,
        ...validLots.map((l) => `${l.longitude},${l.latitude}`),
      ].join(";");

      const res = await fetch(
        `${OSRM_URL}/${coordsStr}?overview=full&geometries=geojson`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteInfo({
            distanceKm: (route.distance / 1000).toFixed(1) as unknown as number,
            durationMin: Math.round(route.duration / 60),
            stops: validLots.length,
          });
        }
      }

      setShowRoute(true);
    } catch {
      // OSRM peut échouer — fallback : juste fit bounds
      const bounds = L.latLngBounds(waypoints);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [selectedIds, lots, userPos]);

  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (map && routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    setShowRoute(false);
    setRouteInfo(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    clearRoute();
  }, [clearRoute]);

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.ctrlBtn}
          onClick={locateUser}
          aria-label="Ma position"
          title="Ma position"
        >
          📍
        </button>
        <button
          type="button"
          className={styles.ctrlBtn}
          onClick={() => {
            const map = mapRef.current;
            if (map) map.setView(ABIDJAN_CENTER, 12);
          }}
          aria-label="Centrer sur Abidjan"
          title="Centrer sur Abidjan"
        >
          🏙️
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.selectionBar}>
          <div className={styles.selInfo}>
            <span className="font-mono">{selectedIds.length} lot(s) sélectionné(s)</span>
            {routeInfo && (
              <span className={styles.routeMeta}>
                {routeInfo.distanceKm} km · {routeInfo.durationMin} min · {routeInfo.stops} arrêt(s)
              </span>
            )}
          </div>
          <div className={styles.selActions}>
            {!showRoute ? (
              <button
                type="button"
                className={styles.routeBtn}
                onClick={calculateRoute}
              >
                🗺️ Calculer l&apos;itinéraire
              </button>
            ) : (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearRoute}
              >
                Effacer l&apos;itinéraire
              </button>
            )}
            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearSelection}
            >
              Tout désélectionner
            </button>
          </div>
        </div>
      )}

      {lots.length === 0 && (
        <div className={styles.emptyMap}>
          <span className="font-mono">Aucun lot disponible dans cette zone</span>
        </div>
      )}
    </div>
  );
}
