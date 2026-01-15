import { Request, Response } from 'express';
import { BooksService } from '../services/books.service';
import { BookStatus, Owner } from '@arcana/shared';
import fs from 'fs';
import { z } from 'zod';

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
  loanedTo: z.string().nullable()
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

    try {
      const result = await BooksService.scanShelfAndSave(req.file.path);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      return res.json(result);
    } catch (error) {
      // Clean up on error too
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Scan Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      return res.status(500).json({
        success: false,
        error: "Scan failed",
        details: errorMessage,
      });
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
      // Adapter: Transform Prisma object to Frontend expected View Model
      const readers = book.readingStatuses.map(status => ({
        name: status.user.name,
        status: status.status
      }));

      // Mock AI Notes structure if not present (since schema has no aiNotes field yet)
      const aiNotes = {
        analysis: "Analyse générée par l'IA non disponible pour le moment.",
        themes: ["Non analysé"],
        questions: ["Pas de questions disponibles"]
      };

      const viewModel = {
        ...book,
        readers,
        aiNotes,
        reviews: [] // Mock empty reviews since not in DB
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
   * Update loan status (who has the book)
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

      const book = await BooksService.updateLoan(req.params.id, validationResult.data.loanedTo);
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
