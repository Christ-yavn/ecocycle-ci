import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ScanRetrait } from "@/components/confirmation/ScanRetrait";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ lotId: string }>;
}) {
  const { lotId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/collecteur/scan/${lotId}`);
  }

  const { data: lot } = await supabase
    .from("lots")
    .select(
      "id, type_dechet, status, collecteur_id, volume_ia, commune, quartier",
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

  if (lot.collecteur_id !== user.id) {
    return (
      <EmptyState icon="alert" title="Accès refusé">
        Ce lot n&apos;est pas réservé par vous.
      </EmptyState>
    );
  }

  if (lot.status !== "reserve") {
    return (
      <EmptyState icon="check" title="Retrait déjà validé">
        Ce lot n&apos;est plus en attente de retrait.
      </EmptyState>
    );
  }

  return (
    <ScanRetrait
      lotId={lotId}
      typeDechet={lot.type_dechet}
      volumeEstime={lot.volume_ia}
      commune={lot.commune}
      quartier={lot.quartier}
    />
  );
}
