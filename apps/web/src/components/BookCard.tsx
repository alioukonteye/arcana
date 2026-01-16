import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKidsMode } from '@/contexts/KidsModeContext';

import { BookOpen } from 'lucide-react';

import { Book } from '@arcana/shared';

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

const statusLabels = {
  TO_READ: { label: 'À lire', variant: 'secondary' as const, emoji: '📖' },
  READING: { label: 'En cours', variant: 'default' as const, emoji: '📚' },
  READ: { label: 'Lu', variant: 'default' as const, emoji: '✅' },
  WISHLIST: { label: 'Envie', variant: 'outline' as const, emoji: '✨' },
};

const ownerEmojis: Record<string, string> = {
  ALIOU: '👨',
  SYLVIA: '👩',
  SACHA: '👦',
  LISA: '👧',
  FAMILY: '👨‍👩‍👧‍👦',
};

const gradients = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-emerald-500',
  'from-orange-500 to-amber-500',
  'from-fuchsia-500 to-purple-600',
];

const patterns = [
  'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
  'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
  'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px)'
];

const getGradient = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradientIndex = Math.abs(hash) % gradients.length;
  const patternIndex = Math.abs(hash) % patterns.length;

  return {
    className: `bg-gradient-to-br ${gradients[gradientIndex]}`,
    style: { backgroundImage: `${patterns[patternIndex]}, linear-gradient(to bottom right, var(--tw-gradient-stops))` }
  };
};

export function BookCard({ book, onClick }: BookCardProps) {
  const { isKidsMode } = useKidsMode();
  const [imgError, setImgError] = useState(false);
  const status = statusLabels[book.status];
  const { className: gradientClass, style: gradientStyle } = getGradient(book.title);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer overflow-hidden h-full flex flex-col"
    >
      {/* Cover Image */}
      <div className="aspect-[2/3] bg-muted relative overflow-hidden">
        {!imgError && book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-4 text-white ${gradientClass}`}
            style={gradientStyle}
          >
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mb-3 shadow-inner">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className={`font-serif text-center font-bold leading-tight drop-shadow-md ${book.title.length > 20 ? 'text-sm' : 'text-base'}`}>
              {book.title}
            </span>
            <span className="text-[10px] text-white/90 text-center mt-2 font-medium uppercase tracking-wider line-clamp-1">
              {book.author}
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {/* Copy Badge */}
          {book.copyNumber > 1 && (
            <Badge variant="destructive" className="text-xs shadow-sm">
              {isKidsMode ? `x${book.copyNumber}` : `${book.copyNumber} copies`}
            </Badge>
          )}

          {/* Loaned Badge */}
          {book.loanedTo && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs shadow-sm">
              {isKidsMode ? '🏠 Prêté' : `Prêté à ${book.loanedTo}`}
            </Badge>
          )}

          {/* Owner Badge */}
          <Badge variant="secondary" className="text-xs shadow-sm bg-white/90 backdrop-blur-sm hover:bg-white/100">
            {isKidsMode ? ownerEmojis[book.owner] : book.owner.charAt(0)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`font-semibold line-clamp-2 ${isKidsMode ? 'text-lg' : 'text-sm'}`} title={book.title}>
            {book.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-1 mt-1">
            {book.author}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <Badge
            variant={status.variant}
            className={
              book.status === 'READ'
                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                : book.status === 'READING'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                  : ''
            }
          >
            {isKidsMode ? status.emoji : status.label}
          </Badge>
        </div>
      </CardContent>
    </Card>

  );
}
