"use client";

import { useState, type ReactNode } from "react";
import type { Role } from "@/types/role";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./DashboardShell.module.css";

export function DashboardShell({
  role,
  title,
  userName,
  children,
}: {
  role: Role;
  title: string;
  userName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar role={role} open={open} onClose={() => setOpen(false)} />
      <div className={styles.main}>
        <Topbar
          title={title}
          userName={userName}
          onMenu={() => setOpen(true)}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
