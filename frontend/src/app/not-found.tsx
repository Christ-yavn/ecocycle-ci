import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        background: "var(--ec-paper-2)",
      }}
    >
      <div className="font-mono" style={{ color: "var(--ec-amber-dark)" }}>
        Erreur 404
      </div>
      <h1 style={{ fontSize: "clamp(1.6rem,1.2rem+2vw,2.2rem)" }}>
        Page introuvable
      </h1>
      <p className="muted" style={{ maxWidth: 420 }}>
        La page que vous recherchez n&apos;existe pas ou n&apos;est pas encore
        disponible dans cette version de la plateforme.
      </p>
      <Button href="/" variant="primary">
        Retour à l&apos;accueil
      </Button>
    </div>
  );
}
