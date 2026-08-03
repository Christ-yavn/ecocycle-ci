import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LotStepper } from "@/components/lot/LotStepper";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function NouveauLotPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/producteur/lots/nouveau");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, commune, quartier")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "producteur") {
    redirect("/login");
  }

  return (
    <Card elevated={false}>
      <LotStepper
        userId={user.id}
        commune={profile.commune}
        quartier={profile.quartier}
      />
    </Card>
  );
}
