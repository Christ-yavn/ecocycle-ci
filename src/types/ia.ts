// Type du résultat d'analyse IA côté Next.js.
// Mapping depuis le format FastAPI (AnalyzeResult) → EcoCycle.

export type AnalyseIa = {
  scoreTri: 1 | 2 | 3 | 4 | 5;
  typeDechet: string;
  volumeIa: number;
  etat: "propre" | "sale" | "melange" | "trie" | "inconnu";
  collectable: boolean;
  recommandations: string[];
  fallbackUsed: boolean;
  items: ItemTrouve[];
  rawScoreQualite: number;
};

export type ItemTrouve = {
  type: string;
  classeBrute: string;
  confidence: number;
  boxXywh: [number, number, number, number];
};

// Mapping : score_qualite (0-100) → score_tri (1-5)
export function scoreQualiteToTri(score: number): 1 | 2 | 3 | 4 | 5 {
  const tri = Math.round(score / 20);
  if (tri >= 5) return 5;
  if (tri <= 1) return 1;
  return tri as 1 | 2 | 3 | 4 | 5;
}
