import { PrismaClient, BookStatus as PrismaBookStatus, Owner as PrismaOwner } from '@prisma/client';
import { GeminiService, ScannedBook } from './gemini.service';
import { GoogleBooksService } from './googlebooks.service';
import {
  BookStatus,
  Owner,
  ScanResult
} from '@arcana/shared';
// Ensure runtime compatibility if shared enum differs (it shouldn't after regen)


const prisma = new PrismaClient();

export const BooksService = {
  /**
   * Bulk scan: Identifies all books on a shelf and auto-inserts them.
   * Uses 70% confidence threshold, silently skips unreadable books.
   */
  async scanShelfAndSave(imagePath: string, mimeType: string = 'image/jpeg'): Promise<ScanResult> {
    const savedBooks: ScanResult['books'] = [];
    const stats = { detected: 0, added: 0, duplicates: 0, skipped: 0 };

    try {
      // Step 1: Bulk identify books with Gemini Flash
      const geminiResults = await GeminiService.identifyShelf(imagePath, mimeType);
      stats.detected = geminiResults.length;

      if (geminiResults.length === 0) {
        return {
          success: true,
          message: 'Aucun livre détecté sur cette image',
          books: [],
          stats,
        };
      }

      // Step 2: Process all books in parallel
      const processPromises = geminiResults.map(async (book: ScannedBook) => {
        try {
          // Cross-validate with Google Books
          const validation = await GoogleBooksService.validateAndEnrich(
            book.title,
            book.author,
            book.publisher // Pass extracted publisher for better matching
          );

          const finalConfidence = (book.confidence + validation.confidence) / 2;

          // 70% threshold - silently skip low confidence
          if (finalConfidence < 0.70) {
            stats.skipped++;
            return null;
          }

          // Check for duplicates
          const existingBook = await prisma.book.findFirst({
            where: {
              title: { contains: book.title, mode: 'insensitive' },
              author: { contains: book.author, mode: 'insensitive' },
            },
          });

          if (existingBook) {
            // Strict mode: detected duplicate, do not add or update copy number
            // Just report it as duplicate
            stats.duplicates++;
            return {
              id: existingBook.id,
              title: existingBook.title,
              author: existingBook.author,
              coverUrl: existingBook.coverUrl || undefined,
              confidence: finalConfidence,
              isNewBook: false,
              copyNumber: existingBook.copyNumber,
            };
          } else {
            // Create new book
            const newBook = await prisma.book.create({
              data: {
                title: book.title,
                author: book.author,
                confidenceScore: finalConfidence,
                googleBooksId: validation.googleBooksId,
                coverUrl: validation.enrichedData?.coverUrl,
                description: validation.enrichedData?.description,
                publisher: validation.enrichedData?.publisher,
                publishedDate: validation.enrichedData?.publishedDate,
                pageCount: validation.enrichedData?.pageCount,
                isbn: validation.enrichedData?.isbn,
                categories: validation.enrichedData?.categories || [],
                status: PrismaBookStatus.TO_READ,
                owner: PrismaOwner.FAMILY,
              },
            });

            stats.added++;
            return {
              id: newBook.id,
              title: newBook.title,
              author: newBook.author,
              coverUrl: newBook.coverUrl || undefined,
              confidence: finalConfidence,
              isNewBook: true,
            };
          }
        } catch (error) {
          console.error(`Error processing book "${book.title}":`, error);
          stats.skipped++;
          return null;
        }
      });

      const results = await Promise.all(processPromises);

      // Filter out null results (skipped books)
      for (const result of results) {
        if (result) {
          savedBooks.push(result);
        }
      }

      const message = this.buildSuccessMessage(stats);

      return {
        success: true,
        message,
        books: savedBooks,
        stats,
      };
    } catch (error) {
      console.error('Shelf Scan Error:', error);
      throw error;
    }
  },

  buildSuccessMessage(stats: ScanResult['stats']): string {
    const parts: string[] = [];

    if (stats.added > 0) {
      parts.push(`${stats.added} nouveau(x) livre(s) ajouté(s)`);
    }
    if (stats.duplicates > 0) {
      parts.push(`${stats.duplicates} copie(s) supplémentaire(s) détectée(s)`);
    }
    if (stats.skipped > 0) {
      parts.push(`${stats.skipped} ignoré(s)`);
    }

    if (parts.length === 0) {
      return 'Aucun livre ajouté';
    }

    return `📚 ${parts.join(', ')}`;
  },

  async getAllBooks(filters?: {
    status?: BookStatus;
    owner?: Owner;
    category?: string;
    author?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.owner) {
      where.owner = filters.owner;
    }
    if (filters?.category) {
      where.categories = { has: filters.category };
    }
    if (filters?.author) {
      where.author = { contains: filters.author, mode: 'insensitive' };
    }

    const whereClause = {
      AND: [
        where,
        filters?.search ? {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { author: { contains: filters.search, mode: 'insensitive' } },
            { isbn: { contains: filters.search, mode: 'insensitive' } },
          ]
        } : {}
      ]
    };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          readingStatuses: true,
        },
        skip,
        take: limit,
      }),
      prisma.book.count({ where: whereClause }),
    ]);

    return {
      data: books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  },

  async getDistinctCategories(): Promise<string[]> {
    const books = await prisma.book.findMany({
      select: { categories: true },
    });

    const allCategories = books.flatMap(b => b.categories);
    return [...new Set(allCategories)].sort();
  },

  async getDistinctAuthors(): Promise<string[]> {
    const books = await prisma.book.findMany({
      select: { author: true },
      distinct: ['author'],
      orderBy: { author: 'asc' },
    });

    return books.map(b => b.author);
  },

  async updateBookStatus(bookId: string, status: BookStatus) {
    return prisma.book.update({
      where: { id: bookId },
      data: { status: status as unknown as PrismaBookStatus },
    });
  },

  async getBookById(bookId: string) {
    return prisma.book.findUnique({
      where: { id: bookId },
      include: {
        loans: true,
        readingStatuses: {
          include: { user: true },
        },
        addedBy: true,
      },
    });
  },

  async updateReadingStatus(bookId: string, userId: string, status: BookStatus) {
    if (status === 'READ') {
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (book && !book.aiAnalysis) {
        try {
          // Trigger AI analysis if not already present
          const analysis = await GeminiService.generateReadingCard(book.title, book.author);
          await prisma.book.update({
            where: { id: bookId },
            data: { aiAnalysis: analysis as any },
          });
        } catch (error) {
          console.error(`Failed to generate AI analysis for book ${bookId}:`, error);
          // Continue even if analysis fails, so user can still mark as read
        }
      }
    }

    // Update global status if user is marking as read?
    // The requirement says "mark as read for current user", but also "book appears read for me".
    // Also "On home page we must see status is read". This implies global status OR per-user status check on list.
    // For now, let's keep global status loose but ensure per-user status is tracked.

    // Custom User Resolution Logic to handle potential ID/Name conflicts
    let targetUserId = userId; // Default to passed ID

    try {
      // 1. Check if user exists by ID
      const existingUser = await prisma.user.findUnique({ where: { id: userId } });

      if (!existingUser) {
        // 2. Check if user exists by Name (case insensitive search if possible, but schema is strict unique)
        // We normalize name from ID: 'ALIOU' -> 'Aliou'
        const normalizedName = userId.charAt(0).toUpperCase() + userId.slice(1).toLowerCase();

        const userByName = await prisma.user.findUnique({
          where: { name: normalizedName }
        });

        if (userByName) {
          // Found by name! Use this existing user's ID
          targetUserId = userByName.id;
        } else {
          // 3. Create new user if not found
          // We can safe create now
          await prisma.user.create({
            data: {
              id: userId, // Try to use the requested ID
              name: normalizedName,
              birthDate: new Date(),
            }
          });
        }
      }
    } catch (e) {
      console.warn("User resolution failed, attempting to proceed with raw ID:", e);
    }

    return prisma.readingStatus.upsert({
      where: {
        userId_bookId: { userId: targetUserId, bookId },
      },
      update: { status: status as unknown as PrismaBookStatus },
      create: {
        bookId,
        userId: targetUserId, // Use the resolved real ID
        status: status as unknown as PrismaBookStatus,
      },
    });
  },

  async updateLoan(bookId: string, loanedTo: string | null, loanDate: Date | null = null) {
    return prisma.book.update({
      where: { id: bookId },
      data: {
        loanedTo,
        loanDate
      },
    });
  },

  async createBook(data: any) {
    // Basic creation, useful for adding to Wishlist from search results
    // We expect the frontend to pass formatted data matchin Book model
    // but strict validation might be needed. For now simplest pass-through.
    return prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        description: data.description,
        coverUrl: data.coverUrl,
        isbn: data.isbn,
        publisher: data.publisher,
        publishedDate: data.publishedDate,
        pageCount: data.pageCount,
        categories: data.categories || [],
        status: data.status || PrismaBookStatus.TO_READ,
        owner: data.owner || PrismaOwner.FAMILY,
        addedById: data.addedById, // To track who requested
      },
    });
  },

  async getReadingCard(bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new Error('Book not found');
    }

    // Generate premium reading card via Gemini Pro
    return GeminiService.generateReadingCard(book.title, book.author);
  },
  async deleteBook(bookId: string) {
    // Delete related records first (cascade should handle this if configured found in schema, but being safe)
    // Schema doesn't have explicit Cascade on all relations, so we relying on Prisma or manual delete?
    // Let's check relation deletion. ReadingStatus has relation, Loan has relation.
    // Ideally we use a transaction.

    return prisma.$transaction(async (tx) => {
      // Delete statuses
      await tx.readingStatus.deleteMany({
        where: { bookId }
      });

      // Delete loans
      await tx.loan.deleteMany({
        where: { bookId }
      });

      // Delete book
      return tx.book.delete({
        where: { id: bookId }
      });
    });
  },
};
