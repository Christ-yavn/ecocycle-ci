"use client";

import { Icon } from "@/components/ui/Icon";
import styles from "./Topbar.module.css";

export function Topbar({
  title,
  userName,
  onMenu,
  notif = 0,
}: {
  title: string;
  userName?: string;
  onMenu: () => void;
  notif?: number;
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
        <button className={styles.bellBtn} aria-label="Notifications">
          <Icon name="bell" size={20} />
          {notif > 0 && <span className={styles.dot} />}
        </button>
        <div className={styles.avatar}>{initials}</div>
        {userName && <span className={styles.userName}>{userName}</span>}
      </div>
    </header>
  );
}
