import { Request, Response } from 'express';
import { BooksService } from '../services/books.service';
import { LLMService } from '../services/llm.service';
import { PrismaClient } from '@prisma/client';
import { BookStatus, Owner } from '@arcana/shared';
import fs from 'fs';
import { z } from 'zod';

const prisma = new PrismaClient();

// ============ Validation Schemas ============
const BookStatusSchema = z.enum(['TO_READ', 'READING', 'READ', 'WISHLIST']);
const OwnerSchema = z.enum(['ALIOU', 'SYLVIA', 'SACHA', 'LISA', 'FAMILY']);

const UpdateStatusSchema = z.object({
  status: BookStatusSchema
});

const UpdateReadingStatusSchema = z.object({
  userId: z.string().min(1),
  status: BookStatusSchema
});

const UpdateLoanSchema = z.object({
  loanedTo: z.string().nullable(),
  loanDate: z.string().optional().nullable()
});

const CreateBookSchema = z.object({
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(200),
  coverUrl: z.string().url().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  publisher: z.string().max(200).optional().nullable(),
  categories: z.array(z.string()).optional().default([]),
  status: BookStatusSchema.optional().default('TO_READ'),
  owner: OwnerSchema.optional().default('FAMILY'),
  isbn: z.string().max(20).optional().nullable()
});

export const BooksController = {
  /**
   * POST /books/scan
   * Bulk shelf scan - identifies all books from a shelf photo
   */
  async scan(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Helper to send SSE events
    const sendEvent = (type: string, payload: any) => {
      res.write(`data: ${JSON.stringify({ type, payload })}\n\n`);
    };

    try {
      console.log(`[Scan] Request received. File: ${req.file.originalname}`);

      const result = await BooksService.scanShelfAndSave(
        req.file.path,
        req.file.mimetype,
        (progress) => {
          sendEvent('progress', progress);
        }
      );

      // Send final result
      sendEvent('complete', result);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.end();
    } catch (error) {
      // Clean up on error too
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("[Scan] Controller Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      sendEvent('error', { message: errorMessage });
      res.end();
    }
  },

  /**
   * POST /books
   * Manually create a book (e.g. for Wishlist)
   */
  async create(req: Request, res: Response) {
    try {
      // Validate input
      const validationResult = CreateBookSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid book data',
          details: validationResult.error.flatten()
        });
      }

      const book = await BooksService.createBook(validationResult.data);
      return res.status(201).json({ success: true, data: book });
    } catch (error) {
      console.error("Create Book Error:", error);
      return res.status(500).json({ success: false, error: "Failed to create book" });
    }
  },

  /**
   * DELETE /books/:id
   */
  async delete(req: Request, res: Response) {
    try {
      await BooksService.deleteBook(req.params.id);
      return res.json({ success: true, message: "Book deleted" });
    } catch (error) {
      console.error("Delete Book Error:", error);
      return res.status(500).json({ success: false, error: "Failed to delete book" });
    }
  },

  /**
   * GET /books
   * Get all books with optional filters
   */
  async getAll(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status as BookStatus | undefined,
        owner: req.query.owner as Owner | undefined,
        category: req.query.category as string | undefined,
        author: req.query.author as string | undefined,
        search: req.query.q as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await BooksService.getAllBooks(filters);
      return res.json({ success: true, ...result });
    } catch (error) {
      console.error("Get Books Error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch books" });
    }
  },

  /**
   * GET /books/filters
   * Get available filter options (categories, authors)
   */
  async getFilterOptions(_req: Request, res: Response) {
    try {
      const [categories, authors] = await Promise.all([
        BooksService.getDistinctCategories(),
        BooksService.getDistinctAuthors(),
      ]);

      return res.json({
        success: true,
        data: {
          categories,
          authors,
          statuses: ['TO_READ', 'READING', 'READ'],
          owners: ['ALIOU', 'SYLVIA', 'SACHA', 'LISA', 'FAMILY'],
        },
      });
    } catch (error) {
      console.error("Get Filter Options Error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch filter options" });
    }
  },

  /**
   * GET /books/:id
   * Get single book with details
   */
  async getById(req: Request, res: Response) {
    try {
      const book = await BooksService.getBookById(req.params.id);
      if (!book) {
        return res.status(404).json({ success: false, error: "Book not found" });
      }

      // Determine user status if userId is provided
      const currentUserId = req.query.userId as string | undefined;
      let userStatus = book.status; // Default to global status

      if (currentUserId) {
        const userReadingStatus = book.readingStatuses.find(rs => rs.userId === currentUserId);
        if (userReadingStatus) {
          userStatus = userReadingStatus.status as BookStatus;
        }
      }

      // Adapter: Transform Prisma object to Frontend expected View Model
      const readers = book.readingStatuses.map(status => ({
        name: status.user.name,
        status: status.status
      }));

      // Use stored AI analysis or fallback mock
      let aiNotes = (book as any).aiAnalysis;

      // Self-healing: Determine what is missing or broken
      const analysisPlaceholder = "Analyse générée par l'IA non disponible";
      const isAnalysisMissing = !aiNotes ||
        (aiNotes.analysis && aiNotes.analysis.includes(analysisPlaceholder));

      let isReviewsMissing = !aiNotes?.reviews || aiNotes.reviews.length === 0;

      if (isAnalysisMissing) {
        // Generate EVERYTHING (fresh start)
        try {
          // Use Promise.allSettled to allow partial success if needed, but Promise.all is cleaner for "all or nothing" logic here
          // We want to force generation even if it failed before
          const [readingCard, pressReviews] = await Promise.all([
            LLMService.generateReadingCard(book.title, book.author),
            LLMService.generatePressReviews(book.title, book.author)
          ]);

          const formattedReviews = pressReviews.map(r => ({
            source: "Presse",
            author: r.source,
            content: r.content,
            rating: 5,
            date: new Date().toISOString()
          }));

          // Map ReadingCard fields to frontend-expected structure
          aiNotes = {
            analysis: readingCard.summary || "Analyse en cours de génération...",
            themes: readingCard.themes || [],
            questions: readingCard.discussionQuestions || [],
            readingLevel: readingCard.readingLevel,
            reviews: formattedReviews
          };

          // Save to DB
          await prisma.book.update({
            where: { id: book.id },
            data: { aiAnalysis: aiNotes } as any
          });

          // We have fresh data now
          isReviewsMissing = false; // Reset this flag as reviews were just generated
        } catch (e) {
          console.error("Failed to generate complete AI analysis:", e);
          // If it fails again, we might want to return the placeholder but NOT save it if possible?
          // Or save it to avoid loop on every refresh if API is down.
          // Let's keep existing fallback behavior but log it.
          aiNotes = {
            analysis: "Analyse générée par l'IA non disponible pour le moment.",
            themes: ["Non analysé"],
            questions: ["Pas de questions disponibles"],
            reviews: []
          };
        }
      } else if (isReviewsMissing) {
        // Analysis exists but reviews missing (previous state)
        try {
          const generatedReviews = await LLMService.generatePressReviews(book.title, book.author);
          if (generatedReviews.length > 0) {
            const formattedReviews = generatedReviews.map(r => ({
              source: "Presse",
              author: r.source,
              content: r.content,
              rating: 5,
              date: new Date().toISOString()
            }));

            aiNotes = { ...aiNotes, reviews: formattedReviews };

            await prisma.book.update({
              where: { id: book.id },
              data: { aiAnalysis: aiNotes } as any
            });
          }
        } catch (e) {
          console.warn("Failed to generate press reviews only:", e);
        }
      }

      // Final Check for defaults if anything failed
      if (!aiNotes) {
        aiNotes = {
          analysis: "Analyse en cours de génération...",
          themes: ["..."],
          questions: ["..."],
          reviews: []
        };
      }

      const reviews = aiNotes.reviews || []; // Ensure reviews is extracted for viewModel

      const viewModel = {
        ...book,
        status: userStatus, // Override status with user-specific status for the view
        readers,
        aiNotes,
        reviews: reviews // Use the fetched/generated reviews
      };

      return res.json({ success: true, data: viewModel });
    } catch (error) {
      console.error("Get Book Error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch book" });
    }
  },

  /**
   * PATCH /books/:id/status
   * Update book's global status
   */
  async updateStatus(req: Request, res: Response) {
    try {
      // Validate input
      const validationResult = UpdateStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          details: validationResult.error.flatten()
        });
      }

      const book = await BooksService.updateBookStatus(req.params.id, validationResult.data.status);
      return res.json({ success: true, data: book });
    } catch (error) {
      console.error("Update Status Error:", error);
      return res.status(500).json({ success: false, error: "Failed to update book status" });
    }
  },

  /**
   * POST /books/:id/reading-status
   * Update per-user reading status
   */
  async updateReadingStatus(req: Request, res: Response) {
    try {
      // Validate input
      const validationResult = UpdateReadingStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reading status data',
          details: validationResult.error.flatten()
        });
      }

      const { userId, status } = validationResult.data;
      const readingStatus = await BooksService.updateReadingStatus(
        req.params.id,
        userId,
        status
      );
      return res.json({ success: true, data: readingStatus });
    } catch (error) {
      console.error("Update Reading Status Error:", error);
      return res.status(500).json({ success: false, error: "Failed to update reading status" });
    }
  },

  /**
   * PATCH /books/:id/loan
   * Update loan status (who has the book and when)
   */
  async updateLoan(req: Request, res: Response) {
    try {
      // Validate input
      const validationResult = UpdateLoanSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid loan data',
          details: validationResult.error.flatten()
        });
      }

      const { loanedTo, loanDate } = validationResult.data;
      const loanDateObj = loanDate ? new Date(loanDate) : (loanedTo ? new Date() : null);

      const book = await BooksService.updateLoan(req.params.id, loanedTo, loanDateObj);
      return res.json({ success: true, data: book });
    } catch (error) {
      console.error("Update Loan Error:", error);
      return res.status(500).json({ success: false, error: "Failed to update loan" });
    }
  },

  /**
   * GET /books/:id/reading-card
   * Generate premium reading card (anti-spoiler: only for READ status)
   */
  async getReadingCard(req: Request, res: Response) {
    try {
      const book = await BooksService.getBookById(req.params.id);

      if (!book) {
        return res.status(404).json({ success: false, error: "Book not found" });
      }

      // Anti-spoiler check
      if (book.status !== 'READ') {
        return res.status(403).json({
          success: false,
          error: "Reading card only available for books marked as read",
        });
      }

      const readingCard = await BooksService.getReadingCard(req.params.id);
      return res.json({ success: true, data: readingCard });
    } catch (error) {
      console.error("Get Reading Card Error:", error);
      return res.status(500).json({ success: false, error: "Failed to generate reading card" });
    }
  },
};
