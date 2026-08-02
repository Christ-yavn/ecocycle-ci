import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { scoreQualiteToTri, type AnalyseIa } from "@/types/ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  // 1. Valider la session Supabase
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

  // 2. Vérifier la configuration de Gemini
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Configuration IA manquante (GEMINI_API_KEY)" },
      { status: 503 },
    );
  }

  // 3. Récupérer l'image
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

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé. Envoyez une image (JPEG, PNG ou WebP)." },
      { status: 400 },
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Fichier trop volumineux. Maximum : 10 Mo." },
      { status: 413 },
    );
  }

  // 4. Préparer l'image pour Gemini
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Data = buffer.toString("base64");
  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };

  // 5. Initialiser Google Gemini (1.5 Flash Vision)
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `Tu es une IA experte en gestion et recyclage des déchets urbains à Abidjan (Côte d'Ivoire).
Analyse l'image fournie et renvoie UNIQUEMENT un objet JSON strictement conforme à ce format :
{
  "typeDechet": "Plastique" | "Métal" | "Verre" | "Papier / Carton" | "Organique" | "Textile" | "Électronique" | "Dangereux" | "Résiduel",
  "volumeIa": <nombre float estimant le poids total en kg, ex: 15.5 pour un gros sac, 0.5 pour quelques bouteilles>,
  "etat": "propre" | "sale" | "melange" | "trie" | "inconnu",
  "collectable": <boolean, true si le volume est intéressant pour un collecteur (ex: > 5kg pour plastique/carton, > 2kg pour métal), false sinon>,
  "recommandations": ["<recommandation 1>", "<recommandation 2>"],
  "rawScoreQualite": <nombre entier entre 0 et 100 estimant la pureté et la propreté du lot>
}

Règles importantes :
- Si c'est un gros sac poubelle ou un amoncellement, estime le poids de manière réaliste (un sac plein de bouteilles PET fait facilement entre 10kg et 35kg, pas 0.5kg !).
- Sois indulgent sur le score de propreté si les matières sont bien triées, même si l'environnement autour est sale.`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // 6. Parser et formater la réponse pour EcoCycle
    const parsed = JSON.parse(responseText);

    const mapped: AnalyseIa = {
      scoreTri: scoreQualiteToTri(parsed.rawScoreQualite || 50),
      typeDechet: parsed.typeDechet || "Résiduel",
      volumeIa: parsed.volumeIa || 0,
      etat: parsed.etat || "inconnu",
      collectable: parsed.collectable || false,
      recommandations: parsed.recommandations || [],
      fallbackUsed: false,
      items: [], // Plus de bounding boxes avec l'API texte
      rawScoreQualite: parsed.rawScoreQualite || 50,
    };

    // 7. Persister l'analyse en base
    try {
      await supabase.from("analyse_ia").insert({
        lot_id: null,
        score_qualite: mapped.rawScoreQualite,
        score_tri: mapped.scoreTri,
        type_dominant: mapped.typeDechet,
        volume_estime: mapped.volumeIa,
        etat: mapped.etat,
        collectable: mapped.collectable,
        recommandations: mapped.recommandations,
        items_trouves: [],
        fallback_used: false,
        confidence_score: 99, // Forte confiance (LLM Vision)
      });
    } catch {
      // Ignorer si échec base de données
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erreur Gemini API :", error);
    return NextResponse.json(
      { error: "L'analyse IA a échoué. Veuillez réessayer.", details: String(error) },
      { status: 500 }
    );
  }
}
