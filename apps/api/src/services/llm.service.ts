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
    publisher: z.string().optional().describe("Publisher if visible"),
    collection: z.string().optional().describe("Collection/Series name if visible"),
    visualHints: z.string().optional().describe("Visual details that helped identify the book"),
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

// Model selection - easily switch providers here
const getVisionModel = () => google('gemini-2.5-flash');
const getTextModel = () => google('gemini-2.5-flash');

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
                                text: `Tu es un expert bibliographe. Analyse cette photo d'étagère.
Identifie CHAQUE livre visible, même partiellement.
Pour chaque livre, extrais le titre et l'auteur.
Attribue un score de confiance (0-1) basé sur la lisibilité.
Sois exhaustif : compte tous les livres visibles.`,
                            },
                            {
                                type: 'image',
                                image: base64Image,
                                mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
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
