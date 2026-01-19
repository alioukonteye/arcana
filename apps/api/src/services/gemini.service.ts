import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

export interface ScannedBook {
  title: string;
  author: string;
  publisher?: string;
  collection?: string;
  spineColor?: string;
  visualHints?: string;
  confidence: number;
}

export const GeminiService = {
  /**
   * Identifies ALL books visible on a shelf from a single photo.
   * Bulk detection mode - exhaustive identification.
   */
  async identifyShelf(imagePath: string, mimeType: string = 'image/jpeg'): Promise<ScannedBook[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    try {
      // 1. Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");

      // 2. Optimized prompt for shelf detection
      const prompt = `
Tu es un expert bibliographe. Analyse cette photo.
Identifie chaque livre visible.
Retourne un TABLEAU JSON d'objets.

Schema:
[
  { "title": "...", "author": "...", "publisher": "...", "collection": "...", "visualHints": "...", "confidence": 0.9 }
]
      `.trim();

      // 3. Call Gemini Flash
      console.log(`[Gemini] Sending request to model: ${model.model} with mimeType: ${mimeType}`);
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);
      console.log('[Gemini] Response received');

      const responseText = result.response.text();
      console.log('[Gemini] Raw Response:', responseText);

      // Clean up markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();

      let books: ScannedBook[];
      try {
        books = JSON.parse(cleanedText) as ScannedBook[];
      } catch (e) {
        console.error('[Gemini] JSON Parse Error:', e);
        console.error('[Gemini] Failed text:', cleanedText);
        throw new Error("Failed to parse Gemini response");
      }

      if (!Array.isArray(books)) {
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
   * Generates a premium reading card for a book.
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
    // Use Flash for speed and lower cost, or Pro if needed. 1.5-flash is good.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    try {
      const prompt = `
Generate a reading card for "${title}" by ${author}.
Return JSON only:
{
  "summary": "Detailed summary in French",
  "themes": ["Theme 1", "Theme 2"],
  "discussionQuestions": ["Q1?", "Q2?"],
  "readingLevel": "Target audience age/level"
}
      `.trim();

      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error("Gemini Reading Card Error:", error);
      throw new Error("Failed to generate reading card");
    }
  },


  /**
   * Generates press reviews/excerpts for a book.
   * Useful when API data is missing.
   */
  async generatePressReviews(title: string, author: string): Promise<Array<{ source: string; content: string }>> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    try {
      const prompt = `
Create 3 plausible press reviews for the book "${title}" by ${author}.
If the book is a classic, use real quotes/sources if known, otherwise simulate prestigious sources.
Return an array of objects.

JSON Schema:
[
  { "source": "New York Times", "content": "A masterpiece..." },
  { "source": "Le Monde", "content": "Une prose magnifique..." }
]
      `.trim();

      const result = await model.generateContent(prompt);
      const response = await result.response;
      // With JSON mode, text() returns valid JSON
      return JSON.parse(response.text());
    } catch (error) {
      console.error("Gemini Press Reviews Error:", error);
      return [];
    }
  },
};
