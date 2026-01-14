import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { Book, BookStatus, Owner } from '@arcana/shared';

export interface UseBooksFilters {
  status?: BookStatus | null;
  owner?: Owner | null;
  category?: string | null;
  author?: string | null;
  search?: string | null;
}

export const useBooks = (filters: UseBooksFilters = {}, refreshTrigger = 0) => {
  const { request } = useApi();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setBooks([]);
    setTotal(0);
  }, [JSON.stringify(filters), refreshTrigger]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.owner) params.append('owner', filters.owner);
        if (filters.category) params.append('category', filters.category);
        if (filters.author) params.append('author', filters.author);
        if (filters.search) params.append('q', filters.search);

        params.append('page', page.toString());
        params.append('limit', '20');

        const response = await request<{
          success: boolean;
          data: Book[];
          pagination: { total: number; page: number; totalPages: number }
        }>(`/books?${params.toString()}`);

        if (response.success && response.data) {
          if (page === 1) {
            setBooks(response.data);
          } else {
            setBooks(prev => {
              // Deduplicate just in case
              const newBooks = response.data.filter(b => !prev.some(p => p.id === b.id));
              return [...prev, ...newBooks];
            });
          }
          setHasMore(page < response.pagination.totalPages);
          setTotal(response.pagination.total);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch books');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [page, JSON.stringify(filters), refreshTrigger]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return { books, isLoading, error, hasMore, loadMore, total };
};
