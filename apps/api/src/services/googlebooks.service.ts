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
  async validateAndEnrich(title: string, author: string): Promise<ValidationResult> {
    try {
      const query = encodeURIComponent(`intitle:${title}+inauthor:${author}`);
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

      // API key is optional for basic queries
      const url = apiKey
        ? `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}&maxResults=5`
        : `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5`;

      const response = await axios.get(url);

      if (!response.data.items || response.data.items.length === 0) {
        return { isValid: false, confidence: 0 };
      }

      // Find best match
      const bestMatch = this.findBestMatch(title, author, response.data.items);

      if (!bestMatch) {
        return { isValid: false, confidence: 0 };
      }

      const volumeInfo = bestMatch.volumeInfo as GoogleBookResult;
      const confidence = this.calculateConfidence(title, author, volumeInfo);

      // Get ISBN
      const isbn = volumeInfo.industryIdentifiers?.find(
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
          isbn,
          categories: volumeInfo.categories || [],
        },
      };
    } catch (error) {
      console.error('Google Books API Error:', error);
      return { isValid: false, confidence: 0 };
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

  findBestMatch(title: string, author: string, items: any[]): any | null {
    const normalizedTitle = title.toLowerCase().trim();
    const normalizedAuthor = author.toLowerCase().trim();

    for (const item of items) {
      const volumeInfo = item.volumeInfo;
      const itemTitle = (volumeInfo.title || '').toLowerCase();
      const itemAuthors = (volumeInfo.authors || []).join(' ').toLowerCase();

      // Check title similarity
      if (itemTitle.includes(normalizedTitle) || normalizedTitle.includes(itemTitle)) {
        // Check author similarity
        if (itemAuthors.includes(normalizedAuthor) || normalizedAuthor.includes(itemAuthors)) {
          return item;
        }
      }
    }

    // Return first result as fallback
    return items[0];
  },

  calculateConfidence(title: string, author: string, volumeInfo: GoogleBookResult): number {
    let score = 0;
    const maxScore = 100;

    const normalizedTitle = title.toLowerCase().trim();
    const normalizedAuthor = author.toLowerCase().trim();
    const bookTitle = (volumeInfo.title || '').toLowerCase();
    const bookAuthors = (volumeInfo.authors || []).join(' ').toLowerCase();

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

    return score / maxScore;
  },
};
