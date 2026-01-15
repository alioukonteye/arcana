import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X, BookOpen, Users, Tag, ChevronRight } from 'lucide-react';
import { useKidsMode } from '@/contexts/KidsModeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOptions {
  categories: string[];
  authors: string[];
  statuses: string[];
  owners: string[];
}

import { BookStatus, Owner } from '@arcana/shared';

export interface SidebarFilters {
  status?: BookStatus | null;
  owner?: Owner | null;
  category?: string | null;
  author?: string | null;
}

interface FilterSidebarProps {
  filters: SidebarFilters;
  onFiltersChange: (filters: SidebarFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  TO_READ: 'À lire',
  READING: 'En cours',
  READ: 'Lu',
};

const ownerLabels: Record<string, { label: string; emoji: string }> = {
  ALIOU: { label: 'Aliou', emoji: '👨' },
  SYLVIA: { label: 'Sylvia', emoji: '👩' },
  SACHA: { label: 'Sacha', emoji: '👦' },
  LISA: { label: 'Lisa', emoji: '👧' },
  FAMILY: { label: 'Famille', emoji: '👨‍👩‍👧‍👦' },
};

export function FilterSidebar({ filters, onFiltersChange, isOpen, onClose }: FilterSidebarProps) {
  const { isKidsMode } = useKidsMode();
  const [options, setOptions] = useState<FilterOptions>({
    categories: [],
    authors: [],
    statuses: ['TO_READ', 'READING', 'READ'],
    owners: ['ALIOU', 'SYLVIA', 'SACHA', 'LISA', 'FAMILY'],
  });

  const { request } = useApi();

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const data = await request<{ success: boolean; data: FilterOptions }>('/books/filters');
      if (data.success) {
        setOptions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const updateFilter = (key: keyof SidebarFilters, value: string | null) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: null,
      owner: null,
      category: null,
      author: null,
    });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Filter content
  const filterContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className={`font-semibold flex items-center gap-2 ${isKidsMode ? 'text-lg' : ''}`}>
          <Filter className="h-5 w-5" />
          {isKidsMode ? '🔍 Filtres' : 'Filtres & Navigation'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <div className="px-4 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full"
          >
            Effacer les {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Quick Member Access */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <Users className="h-4 w-4" />
              {isKidsMode ? 'Qui ?' : 'Membre'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {options.owners.map((owner) => {
                const ownerInfo = ownerLabels[owner] || { label: owner, emoji: '👤' };
                const isActive = filters.owner === owner;
                return (
                  <Button
                    key={owner}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('owner', isActive ? null : owner)}
                    className="justify-start gap-2"
                  >
                    <span>{ownerInfo.emoji}</span>
                    <span>{ownerInfo.label}</span>
                  </Button>
                );
              })}
            </div>
            <Separator className="mt-6" />
          </div>

          {/* Status Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <BookOpen className="h-4 w-4" />
              {isKidsMode ? 'État' : 'Statut de lecture'}
            </h3>
            <div className="space-y-2">
              {options.statuses.map((status) => {
                const isActive = filters.status === status;
                return (
                  <Button
                    key={status}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => updateFilter('status', isActive ? null : status)}
                    className="w-full justify-between"
                  >
                    <span>
                      {isKidsMode
                        ? status === 'TO_READ'
                          ? '📖 À lire'
                          : status === 'READING'
                            ? '📚 En cours'
                            : '✅ Lu'
                        : statusLabels[status]}
                    </span>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </Button>
                );
              })}
            </div>
            <Separator className="mt-6" />
          </div>

          {/* Category Filter */}
          {options.categories.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                  <Tag className="h-4 w-4" />
                  {isKidsMode ? 'Genre' : 'Catégorie'}
                </h3>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => updateFilter('category', value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {options.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />
            </>
          )}

          {/* Author Filter */}
          {options.authors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
                {isKidsMode ? '✍️ Auteur' : 'Auteur'}
              </h3>
              <Select
                value={filters.author || 'all'}
                onValueChange={(value) => updateFilter('author', value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les auteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les auteurs</SelectItem>
                  {options.authors.map((author) => (
                    <SelectItem key={author} value={author}>
                      {author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Mobile: Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="md:hidden fixed inset-0 bg-black/50 z-50"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-card z-50 shadow-xl"
            >
              {filterContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: Fixed sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card flex-col h-full">
        {filterContent}
      </aside>
    </>
  );
}
