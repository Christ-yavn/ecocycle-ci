import type { NotificationRow } from "@/types/database.types";
import { MarkAllReadButton } from "./MarkAllReadButton";
import styles from "./NotificationsView.module.css";

const TYPE_ICONS: Record<string, string> = {
  lot_reserve: "🚛",
  lot_collecte: "✅",
  niveau_atteint: "⭐",
};

function groupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Aujourd'hui";
  if (sameDay(date, yesterday)) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function NotificationsView({
  notifications,
}: {
  notifications: NotificationRow[];
}) {
  const hasUnread = notifications.some((n) => !n.read);

  // Regrouper par date
  const groups = new Map<string, NotificationRow[]>();
  for (const n of notifications) {
    const label = groupLabel(n.created_at);
    const list = groups.get(label) ?? [];
    list.push(n);
    groups.set(label, list);
  }

  return (
    <div className={styles.wrap}>
      {hasUnread && (
        <div className={styles.toolbar}>
          <MarkAllReadButton />
        </div>
      )}

      {notifications.length === 0 ? (
        <p className={styles.empty}>
          Aucune notification pour le moment. Vous serez informé dès
          qu&apos;un collecteur acceptera l&apos;une de vos missions.
        </p>
      ) : (
        [...groups.entries()].map(([label, items]) => (
          <section key={label} className={styles.group}>
            <h2 className={styles.groupTitle}>{label}</h2>
            <ul className={styles.list}>
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`${styles.item} ${!n.read ? styles.itemUnread : ""}`}
                >
                  <span className={styles.icon}>
                    {TYPE_ICONS[n.type] ?? "🔔"}
                  </span>
                  <div className={styles.body}>
                    <span className={styles.title}>{n.title}</span>
                    {n.body && <span className={styles.text}>{n.body}</span>}
                    <span className={styles.time}>
                      {new Date(n.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {!n.read && <span className={styles.unreadDot} />}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
