"use client";

import Link from "next/link";
import type { Role } from "@/types/role";
import { Icon } from "@/components/ui/Icon";
import { NotificationBell } from "@/components/notification/NotificationBell";
import styles from "./AppHeader.module.css";

export function AppHeader({
  userName,
  role,
  onMenu,
}: {
  userName?: string;
  role: Role;
  onMenu?: () => void;
}) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.burger}
        onClick={onMenu}
        aria-label="Ouvrir le menu"
      >
        <Icon name="menu" size={22} />
      </button>

      <Link href={`/${role}`} className={styles.logo} aria-label="EcoLoop CI — Accueil">
        <span className={styles.logoDot} />
        <span className={styles.logoText}>EcoLoop</span>
      </Link>

      <div className={styles.right}>
        <NotificationBell role={role} />
      </div>
    </header>
  );
}
