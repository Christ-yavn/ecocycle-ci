import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConfirmationCollecte } from "@/components/confirmation/ConfirmationCollecte";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: lotId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/producteur/lots/${lotId}/confirmation`);
  }

  // Récupérer le lot + la confirmation couche_1
  const { data: lot } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, status, weight_real, producteur_id, collecteur_id",
    )
    .eq("id", lotId)
    .single();

  if (!lot) {
    return (
      <EmptyState icon="alert" title="Lot introuvable">
        Ce lot n&apos;existe pas ou a été supprimé.
      </EmptyState>
    );
  }

  if (lot.producteur_id !== user.id) {
    return (
      <EmptyState icon="alert" title="Accès refusé">
        Vous n&apos;êtes pas le producteur de ce lot.
      </EmptyState>
    );
  }

  // Récupérer la confirmation
  const { data: conf } = await supabase
    .from("confirmations")
    .select("status, actor_a_confirmed, actor_b_confirmed, poids_reel_kg")
    .eq("lot_id", lotId)
    .eq("step", "couche_1")
    .single();

  // Récupérer le nom du collecteur
  let collecteurName: string | null = null;
  if (lot.collecteur_id) {
    const { data: collecteur } = await supabase
      .from("users")
      .select("name")
      .eq("id", lot.collecteur_id)
      .single();
    collecteurName = collecteur?.name ?? null;
  }

  // Si déjà confirmé ou en litige
  if (conf?.status === "valide") {
    return (
      <EmptyState icon="star" title="Collecte déjà confirmée">
        Ce lot a été confirmé. Vos points ont été crédités.
      </EmptyState>
    );
  }

  if (conf?.status === "litige") {
    return (
      <EmptyState icon="alert" title="Litige en cours">
        Un litige a été ouvert pour ce lot. L&apos;équipe EcoCycle CI arbitre.
      </EmptyState>
    );
  }

  // Vérifier que le collecteur a bien marqué la collecte
  if (lot.status !== "collecte" || !conf?.actor_a_confirmed) {
    return (
      <EmptyState
        icon="truck"
        title="Pas encore de collecte à confirmer"
      >
        Le collecteur n&apos;a pas encore marqué ce lot comme collecté.
        Revenez quand vous aurez reçu une notification.
      </EmptyState>
    );
  }

  return (
    <ConfirmationCollecte
      lotId={lotId}
      typeDechet={lot.type_dechet}
      poidsReel={conf.poids_reel_kg ?? lot.weight_real}
      collecteurName={collecteurName}
    />
  );
}
