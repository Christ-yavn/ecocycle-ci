import type { Role } from "@/types/role";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export const NAV: Record<Role, NavItem[]> = {
  producteur: [
    { href: "/producteur", label: "Accueil", icon: "home" },
    { href: "/producteur/lots", label: "Mes lots", icon: "lot" },
    { href: "/producteur/lots/nouveau", label: "Publier un lot", icon: "plus" },
    { href: "/producteur/recompenses", label: "Récompenses", icon: "star" },
  ],
  collecteur: [
    { href: "/collecteur", label: "Carte des gisements", icon: "map" },
    { href: "/collecteur/tournees", label: "Mes tournées", icon: "route" },
    { href: "/collecteur/stock", label: "Mon stock", icon: "box" },
    { href: "/collecteur/livraisons", label: "Livraisons", icon: "truck" },
  ],
  recycleur: [
    { href: "/recycleur", label: "Marketplace", icon: "market" },
    { href: "/recycleur/commandes", label: "Commandes", icon: "order" },
    { href: "/recycleur/matieres", label: "Mes matières", icon: "recycle" },
  ],
  acheteur: [
    { href: "/acheteur", label: "Catalogue matières", icon: "catalog" },
    { href: "/acheteur/commandes", label: "Mes commandes", icon: "order" },
  ],
  mairie: [
    { href: "/mairie", label: "Tableau de bord", icon: "dashboard" },
    { href: "/mairie/alertes", label: "Dépôts sauvages", icon: "alert" },
    { href: "/mairie/rapports", label: "Rapports", icon: "report" },
  ],
  citoyen: [
    { href: "/citoyen", label: "Signaler un dépôt", icon: "alert" },
    { href: "/citoyen/suivi", label: "Mes signalements", icon: "follow" },
  ],
};
