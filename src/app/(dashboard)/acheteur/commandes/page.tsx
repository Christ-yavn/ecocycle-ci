import { SectionPlaceholder } from "@/components/ui/SectionPlaceholder";

export default function Page() {
  return (
    <SectionPlaceholder
      title="Mes commandes"
      description="Suivez vos demandes d'approvisionnement en matières premières recyclées et confirmez la réception (double confirmation couche 3)."
      cta="Parcourir le catalogue"
      ctaHref="/acheteur"
      icon="order"
    />
  );
}
