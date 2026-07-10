// ============================================================
// Types Supabase — EcoCycle CI
// Schéma de la base de données (généré manuellement, couche 2).
// Pour régénérer automatiquement : npx supabase gen types typescript
//   --project-id zuaohociddfdwaygdrpl > src/types/database.types.ts
// ============================================================

import type { Role } from "./role";

export type LotStatus =
  | "publie"
  | "reserve"
  | "collecte"
  | "livre_recycleur"
  | "traite";

export type TypeDechet =
  | "plastique"
  | "metal"
  | "papier_carton"
  | "verre"
  | "organique"
  | "electronique"
  | "textile"
  | "mixte"
  | "inconnu";

export type ConfirmationStep = "couche_1" | "couche_2" | "couche_3";
export type ConfirmationStatus = "en_attente" | "valide" | "litige";

export type StockStatus = "disponible" | "reserve" | "livre";

export type SignalementStatus =
  | "nouveau"
  | "pris_en_charge"
  | "resolu";

export type AbonnementPlan = "mensuel" | "annuel" | "institutionnel";
export type AbonnementStatut = "actif" | "expire" | "suspendu" | "en_attente";

// --- Ligne public.users ---
export type UserRow = {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email: string | null;
  commune: string | null;
  quartier: string | null;
  type_producteur: string | null;
  points_balance: number;
  points_total: number;
  statut_abonnement: AbonnementStatut;
  date_inscription: string;
};

// --- Ligne public.lots ---
export type LotRow = {
  id: string;
  producteur_id: string;
  type_dechet: TypeDechet;
  status: LotStatus;
  score_tri: number | null;
  volume_ia: number | null;
  weight_real: number | null;
  latitude: number | null;
  longitude: number | null;
  adresse_texte: string | null;
  commune: string | null;
  quartier: string | null;
  photo_url: string | null;
  disponibilite: string | null;
  note: string | null;
  collecteur_id: string | null;
  date_publication: string;
  date_collecte: string | null;
  date_livraison: string | null;
};

// --- Ligne public.confirmations ---
export type ConfirmationRow = {
  id: string;
  lot_id: string;
  step: ConfirmationStep;
  actor_a_id: string | null;
  actor_a_confirmed: boolean;
  actor_a_at: string | null;
  actor_b_id: string | null;
  actor_b_confirmed: boolean;
  actor_b_at: string | null;
  status: ConfirmationStatus;
  poids_reel_kg: number | null;
  note: string | null;
  created_at: string;
};

// --- Ligne public.analyse_ia ---
export type AnalyseIaRow = {
  id: string;
  lot_id: string | null;
  score_qualite: number;
  score_tri: number;
  type_dominant: string;
  volume_estime: number;
  etat: string;
  collectable: boolean;
  recommandations: string[];
  items_trouves: unknown;
  fallback_used: boolean;
  confidence_score: number | null;
  date_analyse: string;
};

// --- Ligne public.signalements ---
export type SignalementRow = {
  id: string;
  citoyen_id: string | null;
  latitude: number | null;
  longitude: number | null;
  commune: string | null;
  quartier: string | null;
  description: string | null;
  photo_url: string | null;
  status: SignalementStatus;
  date_signalement: string;
  date_prise_en_charge: string | null;
  date_resolution: string | null;
};

// --- Ligne public.stocks ---
export type StockRow = {
  id: string;
  owner_id: string;
  type_matiere: string;
  weight_kg: number;
  status: StockStatus;
  date_mise_a_jour: string;
};

// --- Ligne public.point_transactions ---
export type PointTransactionRow = {
  id: string;
  producteur_id: string;
  lot_id: string | null;
  points: number;
  motif: string;
  date_credit: string;
};

// --- Ligne public.abonnements ---
export type AbonnementRow = {
  id: string;
  utilisateur_id: string;
  plan: AbonnementPlan;
  date_debut: string;
  date_fin: string | null;
  statut: AbonnementStatut;
  montant_fcfa: number | null;
};
