import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NotificationsView } from "@/components/notification/NotificationsView";
import type { NotificationRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function CollecteurNotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/collecteur/notifications");
  }

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as unknown as NotificationRow[];

  return (
    <>
      <div className="pageHead">
        <h1>Notifications</h1>
        <p className="muted">Votre activité de collecte en temps réel.</p>
      </div>

      <NotificationsView notifications={notifications} />
    </>
  );
}
