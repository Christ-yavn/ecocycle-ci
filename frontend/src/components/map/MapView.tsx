"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Supercluster from "supercluster";
import { getMarkerConfig, type MapLot } from "@/types/map";
import { Icon } from "@/components/ui/Icon";
import styles from "./MapView.module.css";

// Centre par défaut : Abidjan (Plateau)
const ABIDJAN_CENTER: [number, number] = [5.3097, -4.0122];
const OSRM_TRIP_URL = "https://router.project-osrm.org/trip/v1/driving";

type Coords = { lat: number; lng: number };
type ViewMode = "zones" | "detail";

type RouteInfo = {
  distanceKm: string;
  durationMin: number;
  stops: number;
};

// --- Types Supercluster ---
type LotPointProps = { lotId: string; kg: number };
type ClusterProps = { totalKg: number };
type LotPointFeature = Supercluster.PointFeature<LotPointProps>;
type LotClusterFeature = Supercluster.ClusterFeature<ClusterProps>;

function isClusterFeature(
  feature: LotPointFeature | LotClusterFeature,
): feature is LotClusterFeature {
  return (feature.properties as { cluster?: boolean }).cluster === true;
}

type OsrmTripResponse = {
  code: string;
  trips: Array<{
    geometry: GeoJSON.LineString;
    distance: number;
    duration: number;
  }>;
  waypoints: Array<{
    waypoint_index: number;
    location: [number, number];
  }>;
};

function lotKg(lot: MapLot): number {
  return lot.weightReal ?? lot.volumeIa ?? 0;
}

function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${Math.round(kg)} kg`;
}

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
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("zones");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userPos, setUserPos] = useState<Coords | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // --- Index Supercluster (recalculé quand les lots changent) ---
  const clusterIndex = useMemo(() => {
    const index = new Supercluster<LotPointProps, ClusterProps>({
      radius: 80,
      maxZoom: 15,
      map: (props) => ({ totalKg: props.kg }),
      reduce: (acc, props) => {
        acc.totalKg += props.totalKg;
      },
    });

    const points: LotPointFeature[] = lots
      .filter((l) => l.latitude != null && l.longitude != null)
      .map((l) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [l.longitude!, l.latitude!],
        },
        properties: { lotId: l.id, kg: lotKg(l) },
      }));

    index.load(points);
    return index;
  }, [lots]);

  // --- Init map ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: ABIDJAN_CENTER,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // Tuiles légères pour 2G/3G (CartoDB Voyager)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    clusterLayerRef.current = L.layerGroup().addTo(map);
    stopsLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = new Map();
      clusterLayerRef.current = null;
      routeLayerRef.current = null;
      stopsLayerRef.current = null;
    };
  }, []);

  // --- Rendu des clusters (mode "zones") ---
  const renderClusters = useCallback(() => {
    const map = mapRef.current;
    const layer = clusterLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());
    const clusters = clusterIndex.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom,
    ) as Array<LotPointFeature | LotClusterFeature>;

    clusters.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      if (isClusterFeature(feature)) {
        // --- Cluster : cercle de volume agrégé ---
        const props = feature.properties;
        const totalKg = props.totalKg ?? 0;
        const count = props.point_count;
        const size = Math.min(70, Math.max(42, 34 + Math.sqrt(totalKg) * 1.5));
        const bg =
          totalKg >= 500 ? "#b4522f" : totalKg >= 100 ? "#d9a441" : "#3fa34d";

        const icon = L.divIcon({
          className: styles.markerWrap,
          html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${bg};color:#f3eee1;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            border:3px solid rgba(255,255,255,0.85);
            box-shadow:0 3px 10px rgba(0,0,0,0.3);
            font-family:Manrope,sans-serif;
          ">
            <span style="font-weight:800;font-size:${size > 52 ? 13 : 11}px;line-height:1.1;">${formatKg(totalKg)}</span>
            <span style="font-size:9px;opacity:0.85;line-height:1;">${count} lot${count > 1 ? "s" : ""}</span>
          </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([lat, lng], { icon });
        marker.on("click", () => {
          const expansionZoom = clusterIndex.getClusterExpansionZoom(
            props.cluster_id,
          );
          map.setView([lat, lng], Math.min(expansionZoom + 1, 17), {
            animate: true,
          });
        });
        marker.addTo(layer);
      } else {
        // --- Point isolé : marqueur classique avec popup ---
        const lotId = feature.properties.lotId;
        const lot = lots.find((l) => l.id === lotId);
        if (!lot) return;

        const config = getMarkerConfig(lot.typeDechet);
        const isReserved = reservedIds.includes(lot.id);
        const opacity = isReserved ? 0.4 : 1;

        const icon = L.divIcon({
          className: styles.markerWrap,
          html: `<div style="
            width:24px;height:24px;
            background:${config.color};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:2px solid #ffffff;
            opacity:${opacity};
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        });

        const marker = L.marker([lat, lng], { icon });
        marker.bindPopup(buildPopupHtml(lot, isReserved, config));
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
        marker.addTo(layer);
      }
    });
  }, [clusterIndex, lots, reservedIds, onReserve]);

  // --- Marqueurs mode "détaillé" (vue informelle, lots individuels) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || viewMode !== "detail") return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    lots.forEach((lot) => {
      if (lot.latitude == null || lot.longitude == null) return;

      const config = getMarkerConfig(lot.typeDechet);
      const isReserved = reservedIds.includes(lot.id);
      const isSelected = selectedIds.includes(lot.id);

      const size =
        lot.volumeIa && lot.volumeIa > 50
          ? 34
          : lot.volumeIa && lot.volumeIa > 20
            ? 28
            : 24;
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

      const marker = L.marker([lot.latitude, lot.longitude], {
        icon,
      }).addTo(map);

      marker.bindPopup(buildPopupHtml(lot, isReserved, config));

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
  }, [lots, mapReady, viewMode, selectedIds, reservedIds, onReserve]);

  // --- Synchronisation vue clusters / événements carte ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (viewMode === "zones") {
      // Nettoyer les marqueurs du mode détaillé
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      renderClusters();

      const onMove = () => renderClusters();
      map.on("moveend zoomend", onMove);
      return () => {
        map.off("moveend zoomend", onMove);
      };
    } else {
      clusterLayerRef.current?.clearLayers();
    }
  }, [viewMode, mapReady, renderClusters]);

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
      () => {
        setRouteError(
          "Position GPS indisponible. Autorisez la géolocalisation pour un départ précis — le trajet partira du centre d'Abidjan.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  // --- Itinéraire optimisé (TSP) via OSRM /trip ---
  const calculateRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || selectedIds.length === 0) return;

    setRouteError(null);

    const selectedLots = lots.filter((l) => selectedIds.includes(l.id));
    const validLots = selectedLots.filter(
      (l) => l.latitude != null && l.longitude != null,
    );
    if (validLots.length === 0) return;

    const start: Coords = userPos ?? {
      lat: ABIDJAN_CENTER[0],
      lng: ABIDJAN_CENTER[1],
    };

    // Nettoyer l'ancien tracé
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    stopsLayerRef.current?.clearLayers();

    // /trip résout le TSP : l'ordre des waypoints retournés est optimisé
    // (source=first impose le départ à la position du collecteur).
    const coordsStr = [
      `${start.lng},${start.lat}`,
      ...validLots.map((l) => `${l.longitude},${l.latitude}`),
    ].join(";");

    try {
      const res = await fetch(
        `${OSRM_TRIP_URL}/${coordsStr}?source=first&roundtrip=false&overview=full&geometries=geojson`,
      );
      if (!res.ok) throw new Error(`OSRM ${res.status}`);

      const data = (await res.json()) as OsrmTripResponse;
      if (data.code !== "Ok" || data.trips.length === 0) {
        throw new Error(data.code);
      }

      const trip = data.trips[0];

      // Tracé de la polyligne
      const routeLayer = L.geoJSON(trip.geometry, {
        style: { color: "#3fa34d", weight: 6, opacity: 0.85 },
      }).addTo(map);
      routeLayerRef.current = routeLayer;
      map.fitBounds(routeLayer.getBounds(), { padding: [60, 60] });

      // Marqueurs numérotés dans l'ordre optimisé
      // waypoints[i].waypoint_index = position dans la tournée du point i
      const order = new Map<number, number>();
      data.waypoints.forEach((wp, inputIndex) => {
        order.set(inputIndex, wp.waypoint_index);
      });

      validLots.forEach((lot, i) => {
        const rank = order.get(i + 1); // +1 car l'input 0 = départ
        if (rank == null || lot.latitude == null || lot.longitude == null)
          return;

        const stopIcon = L.divIcon({
          className: styles.markerWrap,
          html: `<div style="
            width:26px;height:26px;border-radius:50%;
            background:#14251b;color:#f3eee1;
            display:flex;align-items:center;justify-content:center;
            border:2px solid #d9a441;
            font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:12px;
            box-shadow:0 2px 6px rgba(0,0,0,0.35);
          ">${rank}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        L.marker([lot.latitude, lot.longitude], { icon: stopIcon }).addTo(
          stopsLayerRef.current!,
        );
      });

      setRouteInfo({
        distanceKm: (trip.distance / 1000).toFixed(1),
        durationMin: Math.round(trip.duration / 60),
        stops: validLots.length,
      });
      setShowRoute(true);
    } catch {
      // Fallback : cadrer sur les lots sans tracé
      const bounds = L.latLngBounds(
        [
          L.latLng(start.lat, start.lng),
          ...validLots.map((l) => L.latLng(l.latitude!, l.longitude!)),
        ],
      );
      map.fitBounds(bounds, { padding: [60, 60] });
      setRouteError(
        "Le service de routage est indisponible. Réessayez dans quelques instants.",
      );
    }
  }, [selectedIds, lots, userPos]);

  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (map && routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    stopsLayerRef.current?.clearLayers();
    setShowRoute(false);
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    clearRoute();
  }, [clearRoute]);

  const switchMode = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      clearRoute();
      setSelectedIds([]);
    },
    [clearRoute],
  );

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />

      {/* Toggle Zones (entreprises) / Détaillé (informel) */}
      <div className={styles.viewToggle}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${viewMode === "zones" ? styles.toggleBtnActive : ""}`}
          onClick={() => switchMode("zones")}
        >
          <Icon name="map" size={14} />
          Zones (gros volumes)
        </button>
        <button
          type="button"
          className={`${styles.toggleBtn} ${viewMode === "detail" ? styles.toggleBtnActive : ""}`}
          onClick={() => switchMode("detail")}
        >
          <Icon name="location" size={14} />
          Lots individuels
        </button>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.ctrlBtn}
          onClick={locateUser}
          aria-label="Ma position"
          title="Ma position"
        >
          <Icon name="location" size={18} />
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
          <Icon name="map" size={18} />
        </button>
      </div>

      {viewMode === "detail" && selectedIds.length > 0 && (
        <div className={styles.selectionBar}>
          <div className={styles.selInfo}>
            <span className="font-mono">
              {selectedIds.length} lot(s) sélectionné(s)
            </span>
            {routeInfo && (
              <span className={styles.routeMeta}>
                {routeInfo.distanceKm} km · {routeInfo.durationMin} min ·{" "}
                {routeInfo.stops} arrêt(s) — ordre optimisé
              </span>
            )}
            {routeError && (
              <span className={styles.routeError}>{routeError}</span>
            )}
          </div>
          <div className={styles.selActions}>
            {!showRoute ? (
              <button
                type="button"
                className={styles.routeBtn}
                onClick={calculateRoute}
              >
                <Icon name="route" size={15} />
                Tournée optimisée
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

      {viewMode === "zones" && routeError && (
        <div className={styles.selectionBar}>
          <div className={styles.selInfo}>
            <span className={styles.routeError}>{routeError}</span>
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

// --- Popup HTML partagée entre les deux vues ---
function buildPopupHtml(
  lot: MapLot,
  isReserved: boolean,
  config: ReturnType<typeof getMarkerConfig>,
): string {
  const scoreStars = lot.scoreTri
    ? "★".repeat(lot.scoreTri) + "☆".repeat(5 - lot.scoreTri)
    : "—";
  const volLabel = lot.weightReal
    ? `${lot.weightReal} kg`
    : lot.volumeIa
      ? `~${lot.volumeIa} kg`
      : "Volume inconnu";
  const statusLabel = isReserved ? "Réservé" : "Disponible";

  return `
    <div style="font-family:Manrope,sans-serif;min-width:200px;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:#2c3b31;margin-bottom:4px;">
        ${config.label} · ${statusLabel}
      </div>
      <div style="font-family:Fraunces,serif;font-weight:700;font-size:1rem;margin-bottom:4px;">${volLabel}</div>
      <div style="font-size:0.8rem;color:#2c3b31;margin-bottom:4px;">Tri : ${scoreStars}</div>
      ${lot.commune ? `<div style="font-size:0.75rem;color:#6b7280;margin-bottom:8px;">${lot.commune}${lot.quartier ? " · " + lot.quartier : ""}</div>` : ""}
      ${
        !isReserved
          ? `<button id="reserve-${lot.id}" style="
              background:#14251b;color:#f3eee1;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.8rem;font-weight:600;width:100%;
            ">Réserver ce lot</button>`
          : `<div style="text-align:center;font-size:0.75rem;color:#b4522f;font-weight:600;">Lot réservé</div>`
      }
    </div>
  `;
}
