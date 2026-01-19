/**
 * LLM Service - Model-Agnostic AI Integration
 *
 * Uses Vercel AI SDK for clean, provider-independent LLM interactions.
 * Currently configured for Google Gemini, but can easily switch to OpenAI, Anthropic, etc.
 */

import { generateObject, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import fs from 'fs';

// ============ Schemas ============

const ScannedBookSchema = z.object({
  title: z.string().describe("Title of the book"),
  author: z.string().describe("Author of the book"),
  isbn: z.string().optional().describe("ISBN-10 or ISBN-13 if visible on the book"),
  publisher: z.string().optional().describe("Publisher if visible"),
  collection: z.string().optional().describe("Collection/Series name if visible"),
  visualHints: z.string().optional().describe("Visual details that helped identify the book (colors, typography, cover art)"),
  confidence: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
});

const ReadingCardSchema = z.object({
  summary: z.string().describe("Detailed summary in French"),
  themes: z.array(z.string()).describe("Main themes of the book"),
  discussionQuestions: z.array(z.string()).describe("Discussion questions in French"),
  readingLevel: z.string().describe("Target audience age/level"),
});

const PressReviewSchema = z.object({
  source: z.string().describe("Name of the publication"),
  content: z.string().describe("Review excerpt"),
});

// ============ Types ============

export type ScannedBook = z.infer<typeof ScannedBookSchema>;
export type ReadingCard = z.infer<typeof ReadingCardSchema>;
export type PressReview = z.infer<typeof PressReviewSchema>;

export type ScanProgress = {
  step: 'uploading' | 'analyzing' | 'identifying' | 'enriching' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  booksFound?: number;
};

// ============ Configuration ============

// Get API key from environment
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured in .env');
}

// Model selection - easily switch providers here
// Pass apiKey explicitly since @ai-sdk/google expects GOOGLE_GENERATIVE_AI_API_KEY by default
const getVisionModel = () => google('gemini-2.5-flash', { apiKey });
const getTextModel = () => google('gemini-2.5-flash', { apiKey });

// ============ Service ============

export const LLMService = {
  /**
   * Identifies ALL books visible on a shelf from a photo.
   * Uses structured output with Zod validation for type safety.
   */
  async identifyShelf(
    imagePath: string,
    mimeType: string = 'image/jpeg',
    onProgress?: (progress: ScanProgress) => void
  ): Promise<ScannedBook[]> {

    onProgress?.({
      step: 'analyzing',
      message: "🤖 Analyse de l'image par l'IA...",
      progress: 20,
    });

    try {
      // Read and encode image
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      onProgress?.({
        step: 'identifying',
        message: "📚 Identification des livres...",
        progress: 40,
      });

      // Explicitly type mimeType to avoid TypeScript inference issues
      const validMimeType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

      // Use Vercel AI SDK's generateObject for structured output
      const { object: books } = await generateObject({
        model: getVisionModel(),
        schema: z.array(ScannedBookSchema),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Tu es un expert bibliographe et iconographe spécialisé dans l'histoire de l'édition. Ta mission est d'identifier avec une précision chirurgicale les livres présents sur cette image.

ERREUR À ÉVITER : Ne confonds pas l'œuvre (le titre/auteur) et l'objet (l'édition spécifique). Ta priorité est l'identification visuelle de la version physique exacte.

Pour chaque livre détecté, analyse et fournis :

0. ISBN (CRUCIAL) : Cherche un code ISBN-10 (10 chiffres) ou ISBN-13 (13 chiffres) visible sur la 4ème de couverture, la tranche, ou près du code-barres. C'est l'identifiant UNIQUE de cette édition spécifique. Si visible, note-le avec précision.

1. TITRE & AUTEUR : Nom complet tel qu'écrit sur la tranche ou la couverture.

2. ÉDITEUR & LOGO : Identifie le nom de la maison d'édition ET décris le logo visible (ex: le petit cheval de Gallimard, le losange de Pocket, le cercle de Points).

3. COLLECTION PRÉCISE : (ex: "Folio SF", "Le Livre de Poche", "10/18", "Bibliothèque de la Pléiade").

4. ATTRIBUTS VISUELS (Crucial pour la couverture) :
  - Couleur dominante du dos et de la couverture.
  - Typographie (ex: police avec empattements, script, gras).
  - Présence d'une illustration, d'un bandeau prix ou d'une jaquette.
  - Format estimé (Poche, Grand Format, Broché, Relié).

5. IDENTIFICATION DE L'ÉDITION : En te basant sur les éléments ci-dessus (surtout l'ISBN si présent), détermine la version spécifique du livre. Si plusieurs couvertures existent pour cette collection, utilise les indices visuels pour choisir la plus probable.

6. SCORE DE CONFIANCE (0-1) : Basé uniquement sur la certitude de l'édition (et non du titre). Si l'ISBN est visible et lisible, confiance = 1.0.

SOIS EXHAUSTIF : Analyse les tranches, même fines ou partiellement masquées. Si un élément est illisible, note "indéterminé" plutôt que de deviner une édition par défaut.`,
              },
              {
                type: 'image',
                image: base64Image,
                mimeType: validMimeType,
              },
            ],
          },
        ],
      });

      onProgress?.({
        step: 'complete',
        message: `✅ ${books.length} livre(s) identifié(s)`,
        progress: 100,
        booksFound: books.length,
      });

      console.log(`📚 LLM identified ${books.length} book(s) on shelf`);
      return books;

    } catch (error) {
      console.error('LLM Shelf Scan Error:', error);
      onProgress?.({
        step: 'error',
        message: "❌ Erreur lors de l'analyse",
        progress: 0,
      });
      throw new Error('Failed to identify books on shelf');
    }
  },

  /**
   * Generates a premium reading card for a book.
   * Anti-spoiler: Only called when book is marked as READ.
   */
  async generateReadingCard(title: string, author: string): Promise<ReadingCard> {
    try {
      const { object } = await generateObject({
        model: getTextModel(),
        schema: ReadingCardSchema,
        prompt: `Génère une fiche de lecture premium pour "${title}" de ${author}.

Inclus:
- Un résumé détaillé en français (sans spoilers majeurs)
- Les thèmes principaux abordés
- 3-4 questions de discussion pour un club de lecture
- Le niveau de lecture recommandé (âge/public cible)

Sois précis et littéraire dans ton analyse.`,
      });

      return object;
    } catch (error) {
      console.error('LLM Reading Card Error:', error);
      throw new Error('Failed to generate reading card');
    }
  },

  /**
   * Generates plausible press reviews for a book.
   * Useful when real reviews are not available.
   */
  async generatePressReviews(title: string, author: string): Promise<PressReview[]> {
    try {
      const { object } = await generateObject({
        model: getTextModel(),
        schema: z.array(PressReviewSchema),
        prompt: `Génère 3 extraits de critiques de presse crédibles pour "${title}" de ${author}.

Si le livre est un classique, utilise des citations réelles si connues.
Sinon, simule des critiques de sources prestigieuses (Le Monde, NYT, etc.).

Les critiques doivent être variées : une positive, une analytique, une émotionnelle.`,
      });

      return object;
    } catch (error) {
      console.error('LLM Press Reviews Error:', error);
      return [];
    }
  },

  /**
   * Simple text generation for ad-hoc needs.
   */
  async generateText(prompt: string): Promise<string> {
    const { text } = await generateText({
      model: getTextModel(),
      prompt,
    });
    return text;
  },
};
