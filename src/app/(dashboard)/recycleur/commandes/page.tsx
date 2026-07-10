import { SectionPlaceholder } from "@/components/ui/SectionPlaceholder";

export default function Page() {
  return (
    <SectionPlaceholder
      title="Mes commandes"
      description="Suivez les demandes de livraison envoyées aux collecteurs et confirmez la réception des stocks (double confirmation couche 2)."
      cta="Explorer la marketplace"
      ctaHref="/recycleur"
      icon="order"
    />
  );
}
