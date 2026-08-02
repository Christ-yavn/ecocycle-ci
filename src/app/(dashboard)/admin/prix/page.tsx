import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MarketPricesEditor } from "@/components/admin/MarketPricesEditor";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  plastique: "Plastique",
  metal: "Métal",
  papier_carton: "Papier / Carton",
  verre: "Verre",
  organique: "Organique",
  electronique: "Électronique",
  textile: "Textile",
  mixte: "Mixte",
  inconnu: "Inconnu",
};

export default async function AdminPrixPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/prix");
  }

  const { data: prices } = await supabase
    .from("market_prices")
    .select("id, type_matiere, prix_fcfa_kg, updated_at")
    .order("type_matiere");

  const items = (prices ?? []).map((p) => ({
    id: p.id as string,
    typeMatiere: p.type_matiere as string,
    label: TYPE_LABELS[p.type_matiere] ?? p.type_matiere,
    prixFcfaKg: p.prix_fcfa_kg as number,
    updatedAt: p.updated_at as string,
  }));

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Market Pricing
          </Badge>
        </div>
        <h1>Prix du marché au kilo</h1>
        <p className="muted">
          Ajustez les prix de référence par matière. Ils impactent
          l&apos;estimation de rentabilité des lots sur toute la plateforme.
        </p>
      </div>

      <MarketPricesEditor items={items} />
    </>
  );
}
