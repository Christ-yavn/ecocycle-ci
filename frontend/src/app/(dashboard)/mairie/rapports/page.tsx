import { SectionPlaceholder } from "@/components/ui/SectionPlaceholder";

export default function Page() {
  return (
    <SectionPlaceholder
      title="Rapports"
      description="Exportez les statistiques de collecte et de recyclage de votre commune au format PDF ou Excel pour vos rapports d'activité environnementale."
      cta="Retour au tableau de bord"
      ctaHref="/mairie"
      icon="report"
    />
  );
}
