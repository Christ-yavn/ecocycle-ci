// NOTE : 'citoyen' existe encore dans l'enum PostgreSQL mais n'est PLUS
// utilisé dans le code (fusionné dans producteur — migration 05).
export type Role =
  | "producteur"
  | "collecteur"
  | "recycleur"
  | "acheteur"
  | "mairie"
  | "admin";

// Rôles avec inscription publique (/register).
export const ROLES: Role[] = ["producteur", "collecteur"];

// Tous les rôles (pour l'admin — les autres sont créés depuis le back-office).
export const ALL_ROLES: Role[] = [
  "producteur",
  "collecteur",
  "recycleur",
  "acheteur",
  "mairie",
  "admin",
];

export const ROLE_LABELS: Record<Role, string> = {
  producteur: "Producteur",
  collecteur: "Collecteur",
  recycleur: "Recycleur",
  acheteur: "Acheteur final",
  mairie: "Mairie / Commune",
  admin: "Administrateur",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  producteur:
    "Triez vos déchets, publiez des lots, signalez les dépôts sauvages et gagnez des points de récompense.",
  collecteur:
    "Visualisez les gisements, optimisez vos tournées et livrez aux recycleurs.",
  recycleur:
    "Commandez des déchets triés, transformez-les et publiez vos matières.",
  acheteur:
    "Consultez le catalogue de matières premières recyclées disponibles.",
  mairie:
    "Supervisez la filière sur votre commune et suivez les dépôts sauvages.",
  admin: "Supervisez la plateforme et fixez les prix du marché.",
};

export const ROLE_ACCES_PAYANT: Record<Role, boolean> = {
  producteur: false,
  collecteur: true,
  recycleur: true,
  acheteur: true,
  mairie: true,
  admin: false,
};

// Sous-activité pour les profils collecteur / recycleur (cases à cocher).
export type SousActivite = "collecte" | "recyclage" | "mixte";

export const SOUS_ACTIVITE_LABELS: Record<SousActivite, string> = {
  collecte: "Collecte uniquement",
  recyclage: "Recyclage uniquement",
  mixte: "Les deux (collecte + recyclage)",
};

// Rôles concernés par le choix d'une sous-activité (back-office admin).
export const ROLES_AVEC_SOUS_ACTIVITE: Role[] = ["collecteur", "recycleur"];
