"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types/role";
import { NAV } from "@/lib/nav";
import { Icon } from "@/components/ui/Icon";
import styles from "./BottomTabBar.module.css";

type Tab = {
  href?: string;
  label: string;
  icon: string;
  action?: "menu";
};

// 4 onglets par rôle (spec EcoLoop). Le 4e ouvre le menu latéral
// (navigation complète + déconnexion).
const TABS: Partial<Record<Role, Tab[]>> = {
  producteur: [
    { href: "/producteur", label: "Accueil", icon: "home" },
    { href: "/producteur/lots", label: "Lots", icon: "lot" },
    { href: "/producteur/activite", label: "Historique", icon: "activity" },
    { label: "Profil", icon: "user", action: "menu" },
  ],
  collecteur: [
    { href: "/collecteur", label: "Accueil", icon: "home" },
    { href: "/collecteur/missions", label: "Missions", icon: "truck" },
    { href: "/collecteur/carte", label: "Carte", icon: "map" },
    { label: "Profil", icon: "user", action: "menu" },
  ],
  acheteur: [
    { href: "/acheteur", label: "Accueil", icon: "home" },
    { href: "/acheteur", label: "Marketplace", icon: "market" },
    { href: "/acheteur/commandes", label: "Offres", icon: "order" },
    { label: "Profil", icon: "user", action: "menu" },
  ],
};

// Fallback générique (recycleur, mairie, admin) : 3 premiers liens NAV + menu.
function fallbackTabs(role: Role): Tab[] {
  const items = NAV[role].slice(0, 3).map((n) => ({
    href: n.href,
    label: n.label.length > 12 ? n.label.slice(0, 12) : n.label,
    icon: n.icon,
  }));
  return [...items, { label: "Profil", icon: "user", action: "menu" as const }];
}

export function BottomTabBar({
  role,
  onMenu,
}: {
  role: Role;
  onMenu?: () => void;
}) {
  const pathname = usePathname();
  const tabs = TABS[role] ?? fallbackTabs(role);

  return (
    <nav className={styles.tabbar} aria-label="Navigation principale">
      {tabs.map((tab) => {
        const isActive =
          tab.href != null &&
          (pathname === tab.href ||
            (tab.href !== `/${role}` && pathname.startsWith(tab.href)));

        if (tab.action === "menu") {
          return (
            <button
              key={tab.label}
              type="button"
              className={styles.tab}
              onClick={onMenu}
              aria-label="Ouvrir le profil et le menu"
            >
              <Icon name={tab.icon} size={20} />
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.href!}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon name={tab.icon} size={20} />
            <span className={styles.tabLabel}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
