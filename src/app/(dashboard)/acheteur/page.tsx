import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogueB2B, type MatiereItem } from "@/components/matiere/CatalogueB2B";

export const dynamic = "force-dynamic";

export default async function AcheteurPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/acheteur");

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "acheteur") redirect("/login");

  // Catalogue : matières disponibles publiées par les recycleurs
  const { data: matieres } = await supabase
    .from("matiere_premiere")
    .select("id, type_matiere, volume_disponible_kg, specifications, grade, conditionnement, date_publication, recycleur_id")
    .eq("status", "disponible")
    .order("date_publication", { ascending: false });

  // Récupérer les noms des recycleurs
  const recycleurIds = [...new Set((matieres ?? []).map((m) => m.recycleur_id).filter(Boolean))];
  const { data: recycleurs } = await supabase
    .from("users")
    .select("id, name, commune, phone")
    .in("id", recycleurIds);

  const recycleurMap = new Map((recycleurs ?? []).map((r) => [r.id, r]));

  const matiereList = matieres ?? [];
  const totalKg = matiereList.reduce((sum, m) => sum + m.volume_disponible_kg, 0);
  const distinctTypes = new Set(matiereList.map((m) => m.type_matiere));

  // Commandes en cours de cet acheteur
  const { count: commandesCount } = await supabase
    .from("matiere_premiere")
    .select("id", { count: "exact", head: true })
    .eq("acheteur_id", user.id)
    .eq("status", "reservee");

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            Acheteur · {profile.name}
          </Badge>
        </div>
        <h1>Catalogue des matières premières</h1>
        <p className="muted">
          Parcourez les matières recyclées publiées par les recycleurs d{"'"}Abidjan. Commandez en un clic — la vente est sécurisée par double confirmation.
        </p>
      </div>

      <div className="grid-stats">
        <Stat label="Matières disponibles" value={matiereList.length} hint="Catalogue" />
        <Stat label="Volume total" value={Math.round(totalKg)} unit="kg" />
        <Stat label="Types distincts" value={distinctTypes.size} />
        <Stat label="Mes commandes en cours" value={commandesCount ?? 0} />
      </div>

      {matiereList.length === 0 ? (
        <EmptyState icon="catalog" title="Aucune matière disponible">
          Les recycleurs n{"'"}ont pas encore publié de matières premières. Revenez bientôt pour découvrir le catalogue.
        </EmptyState>
      ) : (
        <CatalogueB2B
          items={matiereList.map(
            (m): MatiereItem => ({
              id: m.id,
              typeMatiere: m.type_matiere,
              volumeKg: m.volume_disponible_kg,
              specifications: m.specifications,
              grade: m.grade,
              conditionnement: m.conditionnement,
              datePublication: m.date_publication,
              recycleurName: m.recycleur_id
                ? (recycleurMap.get(m.recycleur_id)?.name ?? null)
                : null,
              recycleurCommune: m.recycleur_id
                ? (recycleurMap.get(m.recycleur_id)?.commune ?? null)
                : null,
              recycleurPhone: m.recycleur_id
                ? (recycleurMap.get(m.recycleur_id)?.phone ?? null)
                : null,
            }),
          )}
        />
      )}
    </>
  );
}