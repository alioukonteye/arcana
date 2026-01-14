import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

export interface ScannedBook {
  title: string;
  author: string;
  confidence: number;
}

export const GeminiService = {
  /**
   * Identifies ALL books visible on a shelf from a single photo.
   * Bulk detection mode - exhaustive identification.
   */
  async identifyShelf(imagePath: string): Promise<ScannedBook[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
      // 1. Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");

      // 2. Optimized prompt for shelf detection
      const prompt = `
Analyse cette photo d'étagère. Identifie TOUS les livres visibles.
Pour chaque livre, extrais le titre et l'auteur lisibles sur la tranche.

Retourne UNIQUEMENT un tableau JSON brut (pas de markdown, pas de backticks) :
[
  { "title": "Titre du Livre", "author": "Nom Auteur", "confidence": 0.85 }
]

Règles :
- Sois exhaustif, même pour les tranches inclinées ou partiellement visibles
- Si un titre ou auteur est partiellement lisible, fais de ton mieux
- Estime la confidence (0-1) basée sur la lisibilité
- Si un livre est totalement illisible, ignore-le simplement (ne l'inclus pas)
- Si aucun livre n'est détectable, retourne un tableau vide []
      `.trim();

      // 3. Call Gemini Flash
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg",
          },
        },
      ]);

      const response = await result.response;
      let text = response.text();

      // Clean up markdown if Gemini adds it despite instructions
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const books = JSON.parse(text) as ScannedBook[];

      // Validate response structure
      if (!Array.isArray(books)) {
        console.warn("Gemini returned non-array response, wrapping:", books);
        return [books as ScannedBook];
      }

      console.log(`📚 Gemini identified ${books.length} book(s) on shelf`);
      return books;
    } catch (error) {
      console.error("Gemini Shelf Scan Error:", error);
      throw new Error("Failed to identify books on shelf");
    }
  },

  /**
   * Generates a premium reading card for a book (using Gemini Pro).
   * Only called for books marked as READ (anti-spoiler protection).
   */
  async generateReadingCard(title: string, author: string): Promise<{
    summary: string;
    themes: string[];
    discussionQuestions: string[];
    readingLevel: string;
  }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Pro model for deeper analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-06-05" });

    try {
      const prompt = `
Génère une fiche de lecture premium pour ce livre :
- Titre : ${title}
- Auteur : ${author}

Retourne UNIQUEMENT un JSON brut (pas de markdown) :
{
  "summary": "Résumé approfondi en 5-7 phrases",
  "themes": ["thème 1", "thème 2", "thème 3"],
  "discussionQuestions": ["Question pour enfant 1?", "Question 2?", "Question 3?"],
  "readingLevel": "Niveau recommandé (ex: 8-12 ans, Adulte, etc.)"
}
      `.trim();

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Pro Reading Card Error:", error);
      throw new Error("Failed to generate reading card");
    }
  },
};
