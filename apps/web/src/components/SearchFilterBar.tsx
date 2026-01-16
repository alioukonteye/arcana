import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Search, X, BookOpen, Tag, PenLine } from 'lucide-react';
import { useKidsMode } from '@/contexts/KidsModeContext';
import { BookStatus, Owner } from '@arcana/shared';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SidebarFilters {
  status?: BookStatus | null;
  owner?: Owner | null;
  category?: string | null;
  author?: string | null;
}

interface FilterOptions {
  categories: string[];
  authors: string[];
  statuses: string[];
  owners: string[];
}

interface SearchFilterBarProps {
  filters: SidebarFilters & { search?: string | null };
  onFiltersChange: (filters: SidebarFilters & { search?: string | null }) => void;
}

const statusLabels: Record<string, string> = {
  TO_READ: 'À lire',
  READING: 'En cours',
  READ: 'Lu',
};

export function SearchFilterBar({ filters, onFiltersChange }: SearchFilterBarProps) {
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

  const updateFilter = (key: keyof SidebarFilters | 'search', value: string | null) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'search' && value
  ).length;

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      status: null,
      owner: null,
      category: null,
      author: null,
    });
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full">
      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isKidsMode ? "Cherche un livre..." : "Rechercher par titre, auteur, ISBN..."}
            className="pl-9 h-10 bg-muted/50 border-muted-foreground/10 focus-visible:bg-background transition-colors"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || null)}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => updateFilter('search', null)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters Scroll Area */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex items-center gap-2 pb-1">
            {/* Active Filters Clear Button */}
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="h-8 px-3 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors gap-1"
                onClick={clearFilters}
              >
                <X className="h-3 w-3" />
                {activeFilterCount}
              </Badge>
            )}

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(val) => updateFilter('status', val === 'all' ? null : val)}
            >
              <SelectTrigger
                className={cn(
                  "h-8 rounded-full border-dashed min-w-[100px] gap-2",
                  filters.status && "border-solid bg-secondary border-transparent"
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="truncate max-w-[100px]">
                  {filters.status ? (isKidsMode ? (filters.status === 'TO_READ' ? 'À lire' : filters.status === 'READING' ? 'En cours' : 'Lu') : statusLabels[filters.status]) : (isKidsMode ? 'État' : 'Statut')}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {options.statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {isKidsMode ? (s === 'TO_READ' ? '📖 À lire' : s === 'READING' ? '📚 En cours' : '✅ Lu') : statusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>



            {/* Category Filter */}
            {options.categories.length > 0 && (
              <Select
                value={filters.category || 'all'}
                onValueChange={(val) => updateFilter('category', val === 'all' ? null : val)}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 rounded-full border-dashed min-w-[100px] gap-2",
                    filters.category && "border-solid bg-secondary border-transparent"
                  )}
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[100px]">
                    {filters.category || (isKidsMode ? 'Genre' : 'Catégorie')}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {options.categories.filter(c => c).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Author Filter */}
            {options.authors.length > 0 && (
              <Select
                value={filters.author || 'all'}
                onValueChange={(val) => updateFilter('author', val === 'all' ? null : val)}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 rounded-full border-dashed min-w-[100px] gap-2",
                    filters.author && "border-solid bg-secondary border-transparent"
                  )}
                >
                  <PenLine className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[100px]">
                    {filters.author || (isKidsMode ? 'Auteur' : 'Auteur')}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les auteurs</SelectItem>
                  {options.authors.filter(a => a).map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    </div>
  );
}
