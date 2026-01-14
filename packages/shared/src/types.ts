export type BookStatus = 'TO_READ' | 'READING' | 'READ' | 'WISHLIST';

export type Owner = 'ALIOU' | 'SYLVIA' | 'SACHA' | 'LISA' | 'FAMILY';

export interface User {
  id: string;
  name: string;
  email?: string;
  isChild: boolean;
  birthDate?: string | Date; // Date string or Date object
  clerkId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ReadingStatus {
  id: string;
  userId: string;
  bookId: string;
  status: BookStatus;
  user?: User;
  updatedAt: string | Date;
}

export interface Loan {
  id: string;
  bookId: string;
  borrowerName: string;
  lentById?: string;
  lentAt: string | Date;
  returnedAt?: string | Date | null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  description?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  pageCount?: number | null;
  isbn?: string | null;
  categories: string[];

  // Metadata
  confidenceScore?: number | null;
  googleBooksId?: string | null;

  // Inventory
  status: BookStatus;
  owner: Owner;
  copyNumber: number;

  // Relations
  loanedTo?: string | null;
  loans?: Loan[];
  readingStatuses?: ReadingStatus[];

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ScanStats {
  detected: number;
  added: number;
  duplicates: number;
  skipped: number;
}

export interface ScanResult {
  success: boolean;
  message: string;
  books: Array<Partial<Book> & { isNewBook?: boolean; confidence?: number }>;
  stats: ScanStats;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface FilterOptions {
  categories: string[];
  authors: string[];
  statuses: BookStatus[];
  owners: Owner[];
}
