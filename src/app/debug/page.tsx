"use client";

export default function DebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", fontSize: "0.85rem" }}>
      <h1>Diagnostic EcoLoop CI</h1>

      <h2>Variables d&apos;environnement (client)</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>NEXT_PUBLIC_SUPABASE_URL</td>
            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
              {supabaseUrl ? (
                <span style={{ color: "green" }}>✓ définie</span>
              ) : (
                <span style={{ color: "red" }}>✗ MANQUANTE</span>
              )}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</td>
            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
              {supabaseKey ? (
                <span style={{ color: "green" }}>✓ définie</span>
              ) : (
                <span style={{ color: "red" }}>✗ MANQUANTE</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: "1.5rem" }}>Instructions</h2>
      <p>Si les variables sont MANQUANTES, ajoute-les dans Vercel :</p>
      <ol>
        <li>Va sur vercel.com → ton projet → Settings → Environment Variables</li>
        <li>Ajoute NEXT_PUBLIC_SUPABASE_URL (Supabase → Settings → API → Project URL)</li>
        <li>Ajoute NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase → Settings → API → Publishable key)</li>
        <li>Redeploy le projet (Deployments → ⋯ → Redeploy)</li>
      </ol>
      <p style={{ marginTop: "1rem" }}>
        Voir <code>DEPLOIEMENT.md</code> à la racine du repo pour la checklist complète.
      </p>
    </div>
  );
}