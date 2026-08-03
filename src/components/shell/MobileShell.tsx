"use client";

import type { ReactNode } from "react";
import type { Role } from "@/types/role";
import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";
import styles from "./MobileShell.module.css";

export function MobileShell({
  role,
  userName,
  onMenu,
  children,
}: {
  role: Role;
  userName?: string;
  onMenu?: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <AppHeader userName={userName} role={role} onMenu={onMenu} />
      <main className={styles.content}>{children}</main>
      <BottomTabBar role={role} onMenu={onMenu} />
    </div>
  );
}
