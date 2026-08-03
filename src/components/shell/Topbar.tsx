"use client";

import type { Role } from "@/types/role";
import { Icon } from "@/components/ui/Icon";
import { NotificationBell } from "@/components/notification/NotificationBell";
import styles from "./Topbar.module.css";

export function Topbar({
  title,
  userName,
  role,
  onMenu,
}: {
  title: string;
  userName?: string;
  role: Role;
  onMenu: () => void;
}) {
  const initials = (userName ?? "EC")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenu}
          aria-label="Ouvrir le menu"
        >
          <Icon name="menu" size={22} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.right}>
        <NotificationBell role={role} />
        <div className={styles.avatar}>{initials}</div>
        {userName && <span className={styles.userName}>{userName}</span>}
      </div>
    </header>
  );
}
