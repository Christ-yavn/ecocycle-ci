import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/types/role";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoleIcon } from "@/components/ui/Icon";

type StatItem = {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
};

const PLACEHOLDER_STATS: Record<Role, StatItem[]> = {
  producteur: [
    { label: "Solde points", value: 0 },
    { label: "Lots publiés", value: 0 },
    { label: "Lots collectés", value: 0 },
    { label: "Impact", value: 0, unit: "kg" },
  ],
  collecteur: [
    { label: "Lots disponibles", value: 0, hint: "Dans ma zone" },
    { label: "Collectes ce mois", value: 0 },
    { label: "Stock total", value: 0, unit: "kg" },
    { label: "Livraisons", value: 0 },
  ],
  recycleur: [
    { label: "Stocks collecteurs", value: 0, unit: "kg", hint: "Disponibles" },
    { label: "Commandes en cours", value: 0 },
    { label: "Matières publiées", value: 0 },
    { label: "Reçu ce mois", value: 0, unit: "kg" },
  ],
  acheteur: [
    { label: "Matières disponibles", value: 0, hint: "Catalogue" },
    { label: "Commandes en cours", value: 0 },
    { label: "Achats ce mois", value: 0, unit: "kg" },
    { label: "Recycleurs actifs", value: 0 },
  ],
  mairie: [
    { label: "Volume collecté", value: 0, unit: "kg", hint: "Ce mois" },
    { label: "Taux de recyclage", value: "—" },
    { label: "Producteurs actifs", value: 0 },
    { label: "Dépôts sauvages", value: 0, hint: "Signalements ouverts" },
  ],
  citoyen: [
    { label: "Mes signalements", value: 0 },
    { label: "Pris en charge", value: 0 },
    { label: "Résolus", value: 0 },
  ],
};

const CTA_CONFIG: Record<
  Role,
  { cta: string; ctaHref: string; emptyTitle: string; emptyText: string }
> = {
  producteur: {
    cta: "Publier un nouveau lot",
    ctaHref: "/producteur/lots/nouveau",
    emptyTitle: "Aucun lot publié pour l'instant",
    emptyText:
      "Triez vos déchets, prenez une photo et publiez votre premier lot pour gagner des points.",
  },
  collecteur: {
    cta: "Voir la carte des gisements",
    ctaHref: "/collecteur",
    emptyTitle: "Aucun gisement disponible",
    emptyText:
      "Les lots publiés par les producteurs de votre zone apparaîtront ici sur la carte.",
  },
  recycleur: {
    cta: "Explorer la marketplace",
    ctaHref: "/recycleur",
    emptyTitle: "Aucun stock disponible",
    emptyText:
      "Les stocks de déchets triés publiés par les collecteurs apparaîtront ici.",
  },
  acheteur: {
    cta: "Parcourir le catalogue",
    ctaHref: "/acheteur",
    emptyTitle: "Aucune matière disponible",
    emptyText:
      "Les matières premières recyclées publiées par les recycleurs apparaîtront ici.",
  },
  mairie: {
    cta: "Voir les alertes dépôts sauvages",
    ctaHref: "/mairie/alertes",
    emptyTitle: "Aucune donnée disponible",
    emptyText:
      "Les statistiques de collecte et de recyclage de votre commune apparaîtront ici.",
  },
  citoyen: {
    cta: "Signaler un dépôt sauvage",
    ctaHref: "/citoyen",
    emptyTitle: "Aucun signalement",
    emptyText:
      "Photographiez un dépôt sauvage dans votre quartier et signalez-le à votre mairie.",
  },
};

async function fetchProducteurStats(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<StatItem[]> {
  const { data: profile } = await supabase
    .from("users")
    .select("points_balance, points_total")
    .eq("id", userId)
    .single();

  const { count: lotsCount } = await supabase
    .from("lots")
    .select("id", { count: "exact", head: true })
    .eq("producteur_id", userId);

  const { count: collectedCount } = await supabase
    .from("lots")
    .select("id", { count: "exact", head: true })
    .eq("producteur_id", userId)
    .in("status", ["collecte", "livre_recycleur", "traite"]);

  const { data: weightData } = await supabase
    .from("lots")
    .select("weight_real")
    .eq("producteur_id", userId)
    .not("weight_real", "is", null);

  const totalKg = (weightData ?? []).reduce(
    (sum, l) => sum + (l.weight_real ?? 0),
    0,
  );

  return [
    {
      label: "Solde points",
      value: profile?.points_balance ?? 0,
      hint: `Total cumulé : ${profile?.points_total ?? 0}`,
    },
    { label: "Lots publiés", value: lotsCount ?? 0 },
    { label: "Lots collectés", value: collectedCount ?? 0 },
    { label: "Impact", value: Math.round(totalKg), unit: "kg" },
  ];
}

export async function RoleHome({ role }: { role: Role }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Stats réelles uniquement pour le producteur (couche 3).
  // Les autres rôles auront leurs stats en couches 4/5.
  let stats: StatItem[] = PLACEHOLDER_STATS[role];
  if (user && role === "producteur") {
    stats = await fetchProducteurStats(supabase, user.id);
  }

  const config = CTA_CONFIG[role];

  return (
    <>
      <div className="pageHead">
        <div className="row">
          <Badge tone="signal" dot>
            {ROLE_LABELS[role]}
          </Badge>
        </div>
        <h1>Bienvenue dans votre espace {ROLE_LABELS[role]}</h1>
        <p className="muted">{ROLE_DESCRIPTIONS[role]}</p>
      </div>

      <div className="grid-stats">
        {stats.map((s) => (
          <Stat
            key={s.label}
            label={s.label}
            value={s.value}
            unit={s.unit}
            hint={s.hint}
          />
        ))}
      </div>

      <Card elevated={false}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h3 style={{ marginBottom: "0.25rem" }}>Prochaine action</h3>
            <p style={{ margin: 0 }}>{config.emptyText}</p>
          </div>
          <Button href={config.ctaHref} variant="primary">
            {config.cta}
          </Button>
        </div>
      </Card>

      <EmptyState icon="box" title={config.emptyTitle}>
        {config.emptyText}
      </EmptyState>

      <div
        className="ec-card"
        style={{ display: "flex", gap: "1rem", alignItems: "center" }}
      >
        <span style={{ color: "var(--ec-amber-dark)" }}>
          <RoleIcon role={role} size={28} />
        </span>
        <p style={{ margin: 0, fontSize: "var(--fs-body)" }}>
          {role === "producteur"
            ? "Plus vous triez, plus vous gagnez de points. Les collecteurs et recycleurs n'acceptent que les lots bien triés."
            : `Espace ${ROLE_LABELS[role]} — les fonctionnalités spécifiques seront activées dans les prochaines couches.`}
        </p>
      </div>
    </>
  );
}
