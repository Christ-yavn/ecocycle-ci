"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Role } from "@/types/role";
import { Icon } from "@/components/ui/Icon";
import styles from "./NotificationBell.module.css";

export function NotificationBell({ role }: { role: Role }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnread(data.unread_count ?? 0);
      } catch {
        // Réseau indisponible : la cloche reste sans badge.
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const href =
    role === "producteur" || role === "collecteur"
      ? `/${role}/notifications`
      : `/${role}`;

  return (
    <Link
      href={href}
      className={styles.bell}
      aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
    >
      <Icon name="bell" size={20} />
      {unread > 0 && (
        <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>
      )}
    </Link>
  );
}
