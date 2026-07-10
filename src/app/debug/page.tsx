"use client";

export default function DebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", fontSize: "0.85rem" }}>
      <h1>Diagnostic EcoCycle CI</h1>

      <h2>Variables d&apos;environnement (client)</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>NEXT_PUBLIC_SUPABASE_URL</td>
            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
              {supabaseUrl ? (
                <span style={{ color: "green" }}>✓ {supabaseUrl}</span>
              ) : (
                <span style={{ color: "red" }}>✗ MANQUANTE</span>
              )}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</td>
            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
              {supabaseKey ? (
                <span style={{ color: "green" }}>✓ {supabaseKey.substring(0, 20)}...</span>
              ) : (
                <span style={{ color: "red" }}>✗ MANQUANTE</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: "1.5rem" }}>Instructions</h2>
      <p>Si les variables sont MANQUANTES, tu dois les ajouter dans Vercel :</p>
      <ol>
        <li>Va sur vercel.com → ton projet → Settings → Environment Variables</li>
        <li>Ajoute NEXT_PUBLIC_SUPABASE_URL = https://zuaohociddfdwaygdrpl.supabase.co</li>
        <li>Ajoute NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_RTEg56iFz6JOL7blEgNajQ_jsPYqr3x</li>
        <li>Redeploy le projet</li>
      </ol>
    </div>
  );
}