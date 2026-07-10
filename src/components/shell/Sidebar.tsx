"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types/role";
import { ROLE_LABELS } from "@/types/role";
import { NAV } from "@/lib/nav";
import { Icon } from "@/components/ui/Icon";
import styles from "./Sidebar.module.css";

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = NAV[role];

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} aria-hidden />}
      <aside
        className={`${styles.sidebar} ${open ? styles.open : ""}`}
        aria-label="Navigation"
      >
        <div>
          <Link href={`/${role}`} className={styles.brand} onClick={onClose}>
            <span className={styles.brandDot} />
            EcoCycle CI
          </Link>
          <div className={styles.roleTag}>{ROLE_LABELS[role]}</div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Espace {ROLE_LABELS[role]}</div>
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={styles.iconSlot}>
                  <Icon name={item.icon} size={18} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <Link href="/login" className={styles.footerLink}>
            <Icon name="logout" size={16} />
            Déconnexion
          </Link>
        </div>
      </aside>
    </>
  );
}
