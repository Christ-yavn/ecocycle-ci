import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalyseIa, ItemTrouve } from "@/types/ia";
import { scoreQualiteToTri } from "@/types/ia";

// Route Handler : proxy vers l'API IA FastAPI (Python).
// - Valide la session utilisateur côté Next.js (pas besoin d'auth sur l'API IA pour le MVP).
// - Forward le fichier multipart vers POST /api/classify/analyze.
// - Mappe le résultat FastAPI (AnalyzeResult) → type EcoCycle (AnalyseIa).
// - Persiste l'analyse en base (service role) si l'utilisateur est connecté.

const IA_API_URL = process.env.IA_API_URL ?? "http://localhost:8000";
const IA_TIMEOUT_MS = 60_000;
const COLD_START_HINT = "IA en cours de démarrage, réessayez dans ~30 secondes.";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Type brut de la réponse FastAPI (AnalyzeResult)
type FastApiAnalyzeResult = {
  total_items: number;
  type_dominant: string;
  resume_quantite: Record<string, number>;
  items_trouves: Array<{
    type: string;
    classe_brute: string;
    confidence: number;
    box_xywh: [number, number, number, number];
  }>;
  etat: string;
  score_qualite: number;
  poids_estime_kg: number;
  poids_par_categorie_kg: Record<string, number>;
  collectable: boolean;
  raison_collectabilite: string;
  details_collectabilite: Record<string, unknown>;
  recommandations: string[];
  tips: string[];
  fallback_used: boolean;
  nom_fichier: string | null;
  taille_fichier: number | null;
  timestamp: string;
};

function mapToEcoCycle(raw: FastApiAnalyzeResult): AnalyseIa {
  return {
    scoreTri: scoreQualiteToTri(raw.score_qualite),
    typeDechet: raw.type_dominant,
    volumeIa: raw.poids_estime_kg,
    etat: (raw.etat as AnalyseIa["etat"]) ?? "inconnu",
    collectable: raw.collectable,
    recommandations: raw.recommandations ?? [],
    fallbackUsed: raw.fallback_used,
    items: (raw.items_trouves ?? []).map((it): ItemTrouve => ({
      type: it.type,
      classeBrute: it.classe_brute,
      confidence: it.confidence,
      boxXywh: it.box_xywh,
    })),
    rawScoreQualite: raw.score_qualite,
  };
}

export async function POST(request: NextRequest) {
  // 1. Valider la session
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentification requise" },
      { status: 401 },
    );
  }

  // 2. Récupérer le fichier du FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "FormData invalide" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Fichier 'file' manquant" },
      { status: 400 },
    );
  }

  // 3. Forward vers l'API IA FastAPI
  const iaFormData = new FormData();
  iaFormData.append("file", file, file.name);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IA_TIMEOUT_MS);

  if (!IA_API_URL) {
    return NextResponse.json(
      { error: "Configuration IA manquante (IA_API_URL)", fallback: true },
      { status: 503 },
    );
  }

  let iaResponse: Response;
  const isTimeout = { current: false };
  controller.signal.addEventListener("abort", () => {
    isTimeout.current = true;
  });
  try {
    iaResponse = await fetch(`${IA_API_URL}/api/classify/analyze`, {
      method: "POST",
      body: iaFormData,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    const aborted = isTimeout.current;
    const msg = e instanceof Error ? e.message : "Erreur réseau";
    return NextResponse.json(
      {
        error: aborted ? "IA en cours de démarrage (cold start)" : "API IA indisponible",
        detail: aborted ? COLD_START_HINT : msg,
        retryAfter: 30,
        fallback: true,
      },
      { status: 503 },
    );
  }
  clearTimeout(timeout);

  if (iaResponse.status === 503 || iaResponse.status === 502) {
    const errText = await iaResponse.text().catch(() => "");
    return NextResponse.json(
      {
        error: "IA en cours de démarrage (cold start)",
        detail: COLD_START_HINT,
        upstream: errText,
        retryAfter: 30,
        fallback: true,
      },
      { status: 503 },
    );
  }

  if (!iaResponse.ok) {
    const errText = await iaResponse.text().catch(() => "Erreur inconnue");
    return NextResponse.json(
      {
        error: "Erreur API IA",
        status: iaResponse.status,
        detail: errText,
      },
      { status: iaResponse.status },
    );
  }

  const rawResult = (await iaResponse.json()) as FastApiAnalyzeResult;
  const mapped = mapToEcoCycle(rawResult);

  // 4. Optionnel : persister l'analyse en base (sans lot_id pour l'instant,
  //    le lot sera créé après validation par le producteur)
  try {
    await supabase.from("analyse_ia").insert({
      lot_id: null,
      score_qualite: rawResult.score_qualite,
      score_tri: mapped.scoreTri,
      type_dominant: mapped.typeDechet,
      volume_estime: mapped.volumeIa,
      etat: mapped.etat,
      collectable: mapped.collectable,
      recommandations: mapped.recommandations,
      items_trouves: rawResult.items_trouves ?? null,
      fallback_used: mapped.fallbackUsed,
      confidence_score: null,
    });
  } catch {
    // Non bloquant : l'analyse est retournée même si la persistance échoue
  }

  return NextResponse.json(mapped);
}
