const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const GEMINI_API_KEY = process.env.TEST_API_KEY;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // Base64 tiny 1x1 pixel image
  const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: "image/png",
    },
  };

  const prompt = `Tu es une IA experte en gestion et recyclage des déchets urbains à Abidjan (Côte d'Ivoire).
Analyse l'image fournie et renvoie UNIQUEMENT un objet JSON strictement conforme à ce format :
{
  "typeDechet": "Plastique" | "Métal" | "Verre" | "Papier / Carton" | "Organique" | "Textile" | "Électronique" | "Dangereux" | "Résiduel",
  "volumeIa": <nombre float estimant le poids total en kg, ex: 15.5 pour un gros sac, 0.5 pour quelques bouteilles>,
  "etat": "propre" | "sale" | "melange" | "trie" | "inconnu",
  "collectable": <boolean, true si le volume est intéressant pour un collecteur (ex: > 5kg pour plastique/carton, > 2kg pour métal), false sinon>,
  "recommandations": ["<recommandation 1>", "<recommandation 2>"],
  "rawScoreQualite": <nombre entier entre 0 et 100 estimant la pureté et la propreté du lot>
}`;

  console.log("Envoi de la requête à Gemini 3.6 Flash...");
  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    console.log("Succès ! Voici la réponse brute de l'IA :");
    console.log(responseText);
    
    console.log("Test du formatage JSON...");
    const parsed = JSON.parse(responseText);
    console.log("JSON valide ! Type détecté :", parsed.typeDechet);
  } catch (error) {
    console.error("Erreur :", error.message);
  }
}

run();
