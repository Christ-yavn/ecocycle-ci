import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { QrRetrait } from "@/components/confirmation/QrRetrait";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function RetraitPage({
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
    redirect(`/login?redirect=/producteur/lots/${lotId}/retrait`);
  }

  const { data: lot } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, status, producteur_id, validation_pin, qr_hash, volume_ia, weight_real, commune, quartier",
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

  if (lot.status !== "reserve") {
    return (
      <EmptyState icon="qr" title="Pas de retrait en attente">
        Ce lot n&apos;est pas réservé par un collecteur. Le QR Code et le PIN
        s&apos;affichent quand un collecteur a réservé le lot et arrive sur
        place.
      </EmptyState>
    );
  }

  if (!lot.validation_pin || !lot.qr_hash) {
    return (
      <EmptyState icon="alert" title="Validation indisponible">
        Les codes de validation ne sont pas encore générés pour ce lot.
        Exécutez la migration 04 sur Supabase (voir DEPLOIEMENT.md).
      </EmptyState>
    );
  }

  return (
    <QrRetrait
      lotId={lotId}
      typeDechet={lot.type_dechet}
      pin={lot.validation_pin}
      qrHash={lot.qr_hash}
      volumeEstime={lot.weight_real ?? lot.volume_ia}
      commune={lot.commune}
      quartier={lot.quartier}
    />
  );
}
