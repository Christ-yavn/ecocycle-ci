// Lot simplifié pour affichage sur la carte collecteur.
// Les coordonnées viennent de PostGIS (st_x=lng, st_y=lat).

export type MapLot = {
  id: string;
  typeDechet: string;
  status: string;
  scoreTri: number | null;
  volumeIa: number | null;
  weightReal: number | null;
  latitude: number;
  longitude: number;
  commune: string | null;
  quartier: string | null;
  photoUrl: string | null;
  disponibilite: string | null;
  datePublication: string;
  producteurName: string | null;
};

// Configuration des marqueurs par type de déchet
export const TYPE_MARKER_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  plastique: { color: "#3b82f6", label: "Plastique" },
  metal: { color: "#6b7280", label: "Métal" },
  papier_carton: { color: "#d97706", label: "Papier/Carton" },
  papier: { color: "#d97706", label: "Papier" },
  verre: { color: "#10b981", label: "Verre" },
  organique: { color: "#84cc16", label: "Organique" },
  electronique: { color: "#f59e0b", label: "Électronique" },
  textile: { color: "#a855f7", label: "Textile" },
  mixte: { color: "#ec4899", label: "Mixte" },
  inconnu: { color: "#94a3b8", label: "Inconnu" },
};

export function getMarkerConfig(typeDechet: string) {
  return TYPE_MARKER_CONFIG[typeDechet] ?? TYPE_MARKER_CONFIG.inconnu;
}

// --- Signalements pour la carte mairie ---

export type SignalementMapItem = {
  id: string;
  latitude: number;
  longitude: number;
  commune: string | null;
  quartier: string | null;
  description: string | null;
  photoUrl: string | null;
  status: string;
  dateSignalement: string;
};
