import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookCard } from '@/components/BookCard';

import { FilterSidebar } from '@/components/FilterSidebar';
import { SearchInput } from '@/components/SearchInput';
import { useKidsMode } from '@/contexts/KidsModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, BookOpen, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useBooks, UseBooksFilters } from '@/hooks/useBooks';
import { useApi } from '@/lib/api';
import { ScanStats, BookStatus, Owner } from '@arcana/shared';

interface InventoryPageProps {
  refreshTrigger?: number;
  lastScanStats?: ScanStats | null;
  isMenuOpen: boolean;
  onMenuClose: () => void;
}

// Quick filter chips data
const ownerChips = [
  { value: 'ALIOU', label: 'Aliou', emoji: '👨' },
  { value: 'SYLVIA', label: 'Sylvia', emoji: '👩' },
  { value: 'SACHA', label: 'Sacha', emoji: '👦' },
  { value: 'LISA', label: 'Lisa', emoji: '👧' },
  { value: 'FAMILY', label: 'Famille', emoji: '👨‍👩‍👧‍👦' },
];

const statusChips = [
  { value: 'TO_READ', label: 'À lire', emoji: '📖' },
  { value: 'READING', label: 'En cours', emoji: '📚' },
  { value: 'READ', label: 'Lu', emoji: '✅' },
  { value: 'WISHLIST', label: 'Wishlist', emoji: '🎁' },
];

export function InventoryPage({ refreshTrigger, lastScanStats, isMenuOpen, onMenuClose }: InventoryPageProps) {
  const { isKidsMode } = useKidsMode();

  const [filters, setFilters] = useState<UseBooksFilters>({
    status: null,
    owner: null,
    search: null,
  });

  const { books, isLoading, hasMore, loadMore, total } = useBooks(filters, refreshTrigger);

  const { request } = useApi();

  const [filterOptions, setFilterOptions] = useState<{
    categories: string[];
    authors: string[];
  }>({ categories: [], authors: [] });

  useEffect(() => {
    // Fetch filter options locally
    request<{ success: boolean; data: { categories: string[]; authors: string[] } }>('/books/filters')
      .then(data => {
        if (data.success) {
          setFilterOptions({
            categories: data.data.categories || [],
            authors: data.data.authors || [],
          });
        }
      })
      .catch(err => console.error('Failed to fetch filter options:', err));
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const toggleFilter = (key: keyof UseBooksFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value || null,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: null,
      owner: null,
      category: null,
      author: null,
      search: null,
    });
  };

  if (isLoading && books.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)]">
      {/* Filter Sidebar - Desktop only */}
      <FilterSidebar
        filters={filters}
        onFiltersChange={setFilters}
        isOpen={isMenuOpen}
        onClose={onMenuClose}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile: All filter chips - horizontal scroll */}
        <div className="md:hidden sticky top-0 bg-background z-30 border-b shadow-sm space-y-1 py-2">

          {/* Mobile Search */}
          <div className="px-3 pb-2">
            <SearchInput
              onSearch={handleSearch}
              placeholder={isKidsMode ? "🔍 Chercher un livre..." : "Rechercher par titre, auteur..."}
              className="w-full"
            />
          </div>

          {/* 1. Members */}
          <div className="px-3">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-1">
                {ownerChips.map((chip) => {
                  const isActive = filters.owner === chip.value;
                  return (
                    <Button
                      key={chip.value}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFilter('owner', chip.value as Owner)}
                      className="flex-shrink-0 gap-1.5 rounded-full px-3 h-8"
                    >
                      <span>{chip.emoji}</span>
                      <span>{chip.label}</span>
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* 2. Status */}
          <div className="px-3">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-1">
                {statusChips.map((chip) => {
                  const isActive = filters.status === chip.value;
                  return (
                    <Button
                      key={chip.value}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFilter('status', chip.value as BookStatus)}
                      className="flex-shrink-0 gap-1.5 rounded-full px-3 h-8"
                    >
                      {isKidsMode && <span>{chip.emoji}</span>}
                      <span>{chip.label}</span>
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* 3. Categories (from API) */}
          {filterOptions.categories.length > 0 && (
            <div className="px-3">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-1">
                  <span className="text-xs font-medium text-muted-foreground self-center mr-1">Genres:</span>
                  {filterOptions.categories.map((cat) => {
                    const isActive = filters.category === cat;
                    return (
                      <Button
                        key={cat}
                        variant={isActive ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => toggleFilter('category', cat)}
                        className="flex-shrink-0 rounded-full px-3 h-8"
                      >
                        {cat}
                      </Button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* 4. Authors (from API) */}
          {filterOptions.authors.length > 0 && (
            <div className="px-3">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-1">
                  <span className="text-xs font-medium text-muted-foreground self-center mr-1">Auteurs:</span>
                  {filterOptions.authors.map((author) => {
                    const isActive = filters.author === author;
                    return (
                      <Button
                        key={author}
                        variant={isActive ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => toggleFilter('author', author)}
                        className="flex-shrink-0 rounded-full px-3 h-8"
                      >
                        {author}
                      </Button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Active filters indicator */}
          {activeFilterCount > 0 && (
            <div className="px-3 pb-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} actif{activeFilterCount > 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-3 md:p-6 pb-20">
          {/* Scan Stats Banner */}
          <AnimatePresence>
            {lastScanStats && lastScanStats.detected > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4 md:mb-6 p-3 md:p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {isKidsMode ? '🎉 Scan terminé !' : 'Scan terminé !'}
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {lastScanStats.detected} livre(s) détecté(s) • {lastScanStats.added} ajouté(s)
                  {lastScanStats.duplicates > 0 && ` • ${lastScanStats.duplicates} copie(s)`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header - Hidden on mobile (count shown in chips area) */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <h2 className={`font-bold ${isKidsMode ? 'text-2xl' : 'text-xl'}`}>
              {isKidsMode ? `📚 ${total} livres` : `Votre bibliothèque contient ${total} livre(s)`}
              {activeFilterCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''})
                </span>
              )}
            </h2>

            <SearchInput
              onSearch={handleSearch}
              placeholder="Rechercher..."
              className="w-64"
            />
          </div>

          {/* Mobile header with count */}
          <div className="md:hidden flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">
              {isKidsMode ? `📚 ${total}` : `${total} livre(s)`}
            </h2>
          </div>

          {/* Empty State */}
          {books.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 md:py-20"
            >
              <BookOpen className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg md:text-xl font-semibold mb-2">
                {activeFilterCount > 0
                  ? isKidsMode
                    ? '😕 Pas de livres avec ces filtres'
                    : 'Aucun livre ne correspond aux filtres'
                  : isKidsMode
                    ? '📚 Pas encore de livres !'
                    : 'Votre bibliothèque est vide'}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                {activeFilterCount > 0
                  ? 'Essayez de modifier vos filtres'
                  : isKidsMode
                    ? 'Scanne une étagère pour commencer ! 📸'
                    : 'Scannez une étagère pour ajouter des livres'}
              </p>
            </motion.div>
          ) : (
            /* Book Grid */
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {books.map((book, index) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Link to={`/books/${book.id}`} className="block">
                      <BookCard book={book} />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Infinite Scroll Trigger & Loader */}
              <InfiniteScrollTrigger
                onIntersect={loadMore}
                isLoading={isLoading}
                hasMore={hasMore}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Extracted component for better performance isolation
function InfiniteScrollTrigger({
  onIntersect,
  isLoading,
  hasMore
}: {
  onIntersect: () => void;
  isLoading: boolean;
  hasMore: boolean;
}) {
  const triggerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = triggerRef.current;
    if (!node || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isLoading, hasMore, onIntersect]);

  return (
    <div ref={triggerRef} className="py-8 flex justify-center w-full min-h-[50px]">
      {isLoading && (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
