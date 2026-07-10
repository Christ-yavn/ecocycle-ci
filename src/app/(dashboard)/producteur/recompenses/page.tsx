import { SectionPlaceholder } from "@/components/ui/SectionPlaceholder";

export default function Page() {
  return (
    <SectionPlaceholder
      title="Mes récompenses"
      description="Consultez votre solde de points, votre progression vers les paliers et les bons d'achat disponibles chez nos partenaires."
      cta="Publier un lot pour gagner des points"
      ctaHref="/producteur/lots/nouveau"
      icon="star"
    />
  );
}
