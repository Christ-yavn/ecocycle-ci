import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SignalementForm } from "@/components/citoyen/SignalementForm";

export const dynamic = "force-dynamic";

export default async function ProducteurSignalerPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/producteur/signaler");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "producteur") {
    redirect("/login");
  }

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Producteur · {profile.name}
          </Badge>
        </div>
        <h1>Signaler un dépôt sauvage</h1>
        <p className="muted">
          Vous avez repéré un dépôt sauvage près de votre établissement ?
          Photographiez-le et signalez-le : votre mairie est notifiée en temps
          réel, et vous gagnez des EcoCoins à la résolution.
        </p>
      </div>

      <Card elevated={false}>
        <SignalementForm userId={user.id} redirectTo="/producteur" />
      </Card>
    </>
  );
}
