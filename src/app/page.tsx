import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/types/role";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RoleIcon } from "@/components/ui/Icon";
import styles from "./page.module.css";

export default async function Home() {
  // Si déjà connecté, rediriger vers le dashboard du rôle
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) {
      redirect(`/${profile.role}`);
    }
  }

  return (
    <div className={styles.landing}>
      <header className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          EcoCycle CI
        </div>
        <h1 className={styles.title}>
          La plateforme de gestion circulaire
          <br />
          des déchets à Abidjan
        </h1>
        <p className={styles.lead}>
          EcoCycle CI orchestre toute la chaîne de valeur du déchet — du tri à
          la source par les producteurs jusqu&apos;à la matière première
          recyclée — grâce à un système de double confirmation qui garantit la
          traçabilité sans aucun flux financier sur la plateforme.
        </p>
        <div className={styles.ctaRow}>
          <Button href="/login" variant="primary">
            Se connecter
          </Button>
          <Button href="/register" variant="ghost">
            Créer un compte
          </Button>
        </div>
      </header>

      <section className={styles.roles}>
        <div className={styles.sectionLabel}>
          Choisissez votre espace acteur
        </div>
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
                <span className={styles.roleCta}>
                  Accéder à l&apos;espace →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span className="font-mono">EcoCycle CI · MVP Abidjan · v0.1</span>
      </footer>
    </div>
  );
}
