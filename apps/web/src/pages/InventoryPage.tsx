import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookCard } from '@/components/BookCard';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { useBooks, UseBooksFilters } from '@/hooks/useBooks';
import { ScanStats } from '@arcana/shared';

interface InventoryPageProps {
  refreshTrigger?: number;
  lastScanStats?: ScanStats | null; // Kept as optional for compatibility if needed, but unused in component
}

export function InventoryPage({ refreshTrigger }: InventoryPageProps) {
  const [filters, setFilters] = useState<UseBooksFilters>({
    status: null,
    owner: null,
    search: null,
    category: null,
    author: null,
  });

  const { books, isLoading, total, loadMore } = useBooks(filters, refreshTrigger);

  // Infinite scroll
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading, loadMore]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Search & Filters Header */}
      <SearchFilterBar
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
      />

      {/* Main Content */}
      <div className="flex-1 p-3 md:p-6 bg-muted/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Bibliothèque <span className="text-muted-foreground font-normal ml-2 text-lg">({total})</span>
            </h1>
          </div>

          {total === 0 && !isLoading ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">Aucun livre trouvé</p>
              <p className="text-sm">Essayez de modifier vos filtres ou votre recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
              {books.map((book) => (
                <Link key={book.id} to={`/books/${book.id}`} className="block transition-transform hover:scale-105 duration-200">
                  <BookCard book={book} />
                </Link>
              ))}
            </div>
          )}

          {/* Loading / Sentinel */}
          <div ref={observerTarget} className="h-10 mt-6 flex justify-center items-center">
            {isLoading && <p className="text-muted-foreground text-sm animate-pulse">Chargement...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
