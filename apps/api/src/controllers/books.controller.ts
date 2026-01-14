import { Request, Response } from 'express';
import { BooksService } from '../services/books.service';
import { BookStatus, Owner } from '@arcana/shared';
import fs from 'fs';

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
      const bookData = req.body;
      const book = await BooksService.createBook(bookData);
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
      return res.json({ success: true, data: book });
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
      const { status } = req.body;
      const book = await BooksService.updateBookStatus(req.params.id, status);
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
      const { userId, status } = req.body;
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
      const { loanedTo } = req.body;
      const book = await BooksService.updateLoan(req.params.id, loanedTo);
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
