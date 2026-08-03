import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/types/role";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RoleIcon, Icon } from "@/components/ui/Icon";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  let user = null;
  let supabase = null;
  try {
    supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("[home] Client Supabase indisponible :", err);
  }

  if (user && supabase) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      redirect(`/${profile.role}`);
    }
    redirect("/login?error=no_profile");
  }

  return (
    <div className={styles.landing}>
      <header className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          EcoLoop
        </div>
        <h1 className={styles.title}>L&apos;infrastructure de recyclage pour l&apos;Afrique.</h1>
        <p className={styles.lead}>
          Transformez vos déchets en actifs. EcoLoop orchestre la traçabilité de bout en bout, 
          du tri à la source jusqu&apos;à la matière première recyclée. Zéro friction, 100% auditable.
        </p>
        <div className={styles.ctaRow}>
          <Button href="/register" variant="primary">
            Créer un compte
          </Button>
          <Button href="#technology" variant="outline">
            Découvrir la technologie
          </Button>
          <Button href="/login" variant="ghost">
            Se connecter
          </Button>
        </div>
      </header>

      <section className={styles.socialProof}>
        <div className={styles.socialProofInner}>
          <div className={styles.statBox}>
            <span className={styles.statValue}>1,240</span>
            <span className={styles.statLabel}>Tonnes traitées</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statValue}>45+</span>
            <span className={styles.statLabel}>Partenaires industriels</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statValue}>100%</span>
            <span className={styles.statLabel}>Traçabilité cryptographique</span>
          </div>
        </div>
      </section>

      <section className={styles.roles} id="technology">
        <div className={styles.sectionLabel}>SÉLECTIONNEZ VOTRE PORTAIL D&apos;ACCÈS</div>
        <div className={styles.grid}>
          {ROLES.map((role) => (
            <Link key={role} href={`/${role}`} className={styles.roleLink}>
              <Card elevated>
                <div className={styles.roleHead}>
                  <span className={styles.roleIcon}>
                    <RoleIcon role={role} size={22} />
                  </span>
                  <span className={styles.roleName}>{ROLE_LABELS[role]}</span>
                </div>
                <p className={styles.roleDesc}>{ROLE_DESCRIPTIONS[role]}</p>
                <div className={styles.roleFooter}>
                  <span className={styles.roleCta}>Accéder au portail</span>
                  <Icon name="follow" size={16} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.brandDot} />
          <span className="font-mono">EcoLoop v2.0.0-beta</span>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/privacy">Confidentialité</Link>
          <Link href="/terms">CGU</Link>
          <Link href="/contact">Support</Link>
        </div>
      </footer>
    </div>
  );
}
