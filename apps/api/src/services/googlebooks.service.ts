import axios from 'axios';

interface GoogleBookResult {
  id: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  googleBooksId?: string;
  enrichedData?: {
    coverUrl?: string;
    description?: string;
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    isbn?: string;
    categories?: string[];
  };
}

export const GoogleBooksService = {
  async validateAndEnrich(
    title: string,
    author: string,
    isbn?: string,
    publisher?: string,
    collection?: string
  ): Promise<ValidationResult> {
    try {
      // Strategy 1: If ISBN is provided, search by ISBN first (most precise)
      if (isbn) {
        console.log(`🔍 Searching by ISBN: ${isbn}`);
        const isbnResult = await this.searchByISBN(isbn);
        if (isbnResult) {
          return isbnResult;
        }
        console.log(`⚠️  ISBN search failed, falling back to title/author search`);
      }

      // Strategy 2: Search by title + author + publisher + collection
      let query = `intitle:${title}+inauthor:${author}`;
      if (publisher) {
        query += `+inpublisher:${publisher}`;
      }
      // Note: Google Books API doesn't have a direct "collection" filter,
      // but we can use it in the matching logic below

      const encodedQuery = encodeURIComponent(query);
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

      // API key is optional for basic queries
      const url = apiKey
        ? `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&key=${apiKey}&maxResults=10`
        : `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=10`;

      const response = await axios.get(url);

      if (!response.data.items || response.data.items.length === 0) {
        // Fallback: if publisher was used and no results, try without publisher
        if (publisher || collection) {
          return this.validateAndEnrich(title, author);
        }
        return { isValid: false, confidence: 0 };
      }

      // Find best match considering publisher and collection
      const bestMatch = this.findBestMatch(title, author, response.data.items, publisher, collection);

      if (!bestMatch) {
        // Fallback if strict matching failed
        if (publisher || collection) {
          return this.validateAndEnrich(title, author);
        }
        return { isValid: false, confidence: 0 };
      }

      const volumeInfo = bestMatch.volumeInfo as GoogleBookResult;
      const confidence = this.calculateConfidence(title, author, volumeInfo, publisher, collection);

      // Get ISBN from result
      const resultIsbn = volumeInfo.industryIdentifiers?.find(
        (id: { type: string }) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;

      // Get best available cover (prefer larger images)
      const coverUrl = this.getBestCoverUrl(volumeInfo.imageLinks);

      return {
        isValid: confidence > 0.5,
        confidence,
        googleBooksId: bestMatch.id,
        enrichedData: {
          coverUrl,
          description: volumeInfo.description,
          publisher: volumeInfo.publisher,
          publishedDate: volumeInfo.publishedDate,
          pageCount: volumeInfo.pageCount,
          isbn: resultIsbn,
          categories: volumeInfo.categories || [],
        },
      };
    } catch (error) {
      console.error('Google Books API Error:', error);
      return { isValid: false, confidence: 0 };
    }
  },

  /**
   * Search directly by ISBN (most accurate method)
   */
  async searchByISBN(isbn: string): Promise<ValidationResult | null> {
    try {
      // Clean ISBN (remove dashes, spaces)
      const cleanIsbn = isbn.replace(/[-\s]/g, '');

      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const url = apiKey
        ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`
        : `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;

      const response = await axios.get(url);

      if (!response.data.items || response.data.items.length === 0) {
        return null;
      }

      // ISBN search should return exact match (usually just 1 result)
      const bestMatch = response.data.items[0];
      const volumeInfo = bestMatch.volumeInfo as GoogleBookResult;

      const resultIsbn = volumeInfo.industryIdentifiers?.find(
        (id: { type: string }) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;

      const coverUrl = this.getBestCoverUrl(volumeInfo.imageLinks);

      return {
        isValid: true,
        confidence: 1.0, // ISBN match = 100% confidence
        googleBooksId: bestMatch.id,
        enrichedData: {
          coverUrl,
          description: volumeInfo.description,
          publisher: volumeInfo.publisher,
          publishedDate: volumeInfo.publishedDate,
          pageCount: volumeInfo.pageCount,
          isbn: resultIsbn,
          categories: volumeInfo.categories || [],
        },
      };
    } catch (error) {
      console.error('ISBN Search Error:', error);
      return null;
    }
  },

  getBestCoverUrl(imageLinks?: GoogleBookResult['imageLinks']): string | undefined {
    if (!imageLinks) return undefined;

    // Prefer larger images, fallback to smaller ones
    const url = imageLinks.large
      || imageLinks.medium
      || imageLinks.small
      || imageLinks.thumbnail
      || imageLinks.smallThumbnail;

    // Convert to HTTPS
    if (!url) return undefined;

    let secureUrl = url.replace('http:', 'https:');

    // Remove "edge=curl" to get a flat image
    secureUrl = secureUrl.replace('&edge=curl', '');

    // Try to get higher quality by setting zoom=0 (which often returns the largest available)
    // or removing zoom parameter entirely if 0 fails (but 0 is usually safer standard for 'base' size)
    secureUrl = secureUrl.replace('&zoom=1', '&zoom=0');

    return secureUrl;
  },

  findBestMatch(
    title: string,
    author: string,
    items: any[],
    publisher?: string,
    collection?: string
  ): any | null {
    const normalizedTitle = title.toLowerCase().trim();
    const normalizedAuthor = author.toLowerCase().trim();
    const normalizedPublisher = publisher?.toLowerCase().trim();
    const normalizedCollection = collection?.toLowerCase().trim();

    for (const item of items) {
      const volumeInfo = item.volumeInfo;
      const itemTitle = (volumeInfo.title || '').toLowerCase();
      const itemAuthors = (volumeInfo.authors || []).join(' ').toLowerCase();
      const itemPublisher = (volumeInfo.publisher || '').toLowerCase();
      // Collection info might be in subtitle or title
      const itemSubtitle = (volumeInfo.subtitle || '').toLowerCase();
      const fullItemTitle = `${itemTitle} ${itemSubtitle}`;

      // Check title similarity
      if (itemTitle.includes(normalizedTitle) || normalizedTitle.includes(itemTitle)) {
        // Check author similarity
        if (itemAuthors.includes(normalizedAuthor) || normalizedAuthor.includes(itemAuthors)) {
          // If publisher provided, check publisher match
          if (normalizedPublisher) {
            if (itemPublisher.includes(normalizedPublisher) || normalizedPublisher.includes(itemPublisher)) {
              // If collection also provided, prefer exact collection match
              if (normalizedCollection) {
                if (fullItemTitle.includes(normalizedCollection) || itemPublisher.includes(normalizedCollection)) {
                  // Perfect match with publisher AND collection
                  return item;
                }
                // Continue searching for better match
                continue;
              }
              // Perfect match with publisher
              return item;
            }
          } else {
            return item;
          }
        }
      }
    }

    // If we demanded publisher/collection but didn't find exact match, try more lenient search
    if (publisher || collection) {
      // Try to find just title/author match ignoring publisher/collection
      return this.findBestMatch(title, author, items);
    }

    return items[0];
  },

  calculateConfidence(
    title: string,
    author: string,
    volumeInfo: GoogleBookResult,
    publisher?: string,
    collection?: string
  ): number {
    let score = 0;
    const maxScore = (publisher ? 20 : 0) + (collection ? 15 : 0) + 100; // Dynamic max based on available metadata

    const normalizedTitle = title.toLowerCase().trim();
    const normalizedAuthor = author.toLowerCase().trim();
    const bookTitle = (volumeInfo.title || '').toLowerCase();
    const bookAuthors = (volumeInfo.authors || []).join(' ').toLowerCase();
    const bookSubtitle = (volumeInfo.subtitle || '').toLowerCase();
    const fullTitle = `${bookTitle} ${bookSubtitle}`;

    // Title match (50 points max)
    if (bookTitle === normalizedTitle) {
      score += 50;
    } else if (bookTitle.includes(normalizedTitle) || normalizedTitle.includes(bookTitle)) {
      score += 35;
    } else {
      // Partial word match
      const titleWords = normalizedTitle.split(' ');
      const matchedWords = titleWords.filter(w => bookTitle.includes(w));
      score += Math.min(25, (matchedWords.length / titleWords.length) * 25);
    }

    // Author match (50 points max)
    if (bookAuthors.includes(normalizedAuthor) || normalizedAuthor.includes(bookAuthors)) {
      score += 50;
    } else {
      const authorWords = normalizedAuthor.split(' ');
      const matchedWords = authorWords.filter(w => bookAuthors.includes(w));
      score += Math.min(35, (matchedWords.length / authorWords.length) * 35);
    }

    // Publisher match (20 bonus points)
    if (publisher && volumeInfo.publisher) {
      const normalizedPublisher = publisher.toLowerCase().trim();
      const bookPublisher = volumeInfo.publisher.toLowerCase();
      if (bookPublisher.includes(normalizedPublisher) || normalizedPublisher.includes(bookPublisher)) {
        score += 20;
      }
    }

    // Collection match (15 bonus points) - check in title/subtitle
    if (collection) {
      const normalizedCollection = collection.toLowerCase().trim();
      if (fullTitle.includes(normalizedCollection) ||
        (volumeInfo.publisher && volumeInfo.publisher.toLowerCase().includes(normalizedCollection))) {
        score += 15;
      }
    }

    return Math.min(1, score / maxScore); // Cap at 1.0
  },
};
