export type Role =
  | "producteur"
  | "collecteur"
  | "recycleur"
  | "acheteur"
  | "mairie"
  | "citoyen";

export const ROLES: Role[] = [
  "producteur",
  "collecteur",
  "recycleur",
  "acheteur",
  "mairie",
  "citoyen",
];

export const ROLE_LABELS: Record<Role, string> = {
  producteur: "Producteur",
  collecteur: "Collecteur",
  recycleur: "Recycleur",
  acheteur: "Acheteur final",
  mairie: "Mairie / Commune",
  citoyen: "Citoyen",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  producteur:
    "Triez vos déchets, publiez des lots et gagnez des points de récompense.",
  collecteur:
    "Visualisez les gisements, optimisez vos tournées et livrez aux recycleurs.",
  recycleur:
    "Commandez des déchets triés, transformez-les et publiez vos matières.",
  acheteur:
    "Consultez le catalogue de matières premières recyclées disponibles.",
  mairie:
    "Supervisez la filière sur votre commune et suivez les dépôts sauvages.",
  citoyen: "Signalez les dépôts sauvages dans votre quartier.",
};

export const ROLE_ACCES_PAYANT: Record<Role, boolean> = {
  producteur: false,
  collecteur: true,
  recycleur: true,
  acheteur: true,
  mairie: true,
  citoyen: false,
};
