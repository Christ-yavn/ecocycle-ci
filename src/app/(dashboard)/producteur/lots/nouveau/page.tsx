import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LotForm } from "@/components/lot/LotForm";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import styles from "./page.module.css";

export default async function NouveauLotPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/producteur/lots/nouveau");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, commune, quartier")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "producteur") {
    redirect("/login");
  }

  return (
    <>
      <div className="pageHead">
        <h1>Publier un nouveau lot</h1>
        <p className="muted">
          Triez vos déchets, prenez une photo et laissez l&apos;IA analyser le
          niveau de tri. Plus le tri est bon, plus vous gagnez de points.
        </p>
      </div>

      <Card>
        <div className={styles.guide}>
          <div className={styles.guideHead}>
            <Icon name="star" size={20} />
            <span className="font-mono">Guide de tri rapide</span>
          </div>
          <ul className={styles.guideList}>
            <li>Séparez le plastique, métal, papier, verre et organique</li>
            <li>Regroupez proprement (attachez les sacs, empilez les cartons)</li>
            <li>Retirez les déchets alimentaires du lot recyclable</li>
            <li>Bonne luminosité pour la photo (dehors si possible)</li>
          </ul>
        </div>
      </Card>

      <Card elevated={false}>
        <LotForm userId={user.id} />
      </Card>
    </>
  );
}
