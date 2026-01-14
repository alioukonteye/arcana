import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Review {
  source: string;
  author: string;
  content: string;
  rating?: number;
  date?: string;
}

interface ReviewSectionProps {
  reviews: Review[];
  isLoading?: boolean;
}

export function ReviewSection({ reviews, isLoading }: ReviewSectionProps) {
  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-xl">
        <p>Aucune critique disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-serif font-bold">Critiques & Avis</h3>
      <div className="grid gap-6 md:grid-cols-2">
        {reviews.map((review, idx) => (
          <blockquote
            key={idx}
            className="relative p-6 bg-secondary/20 rounded-xl border-l-4 border-primary/20"
          >
            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
            <p className="text-lg italic text-foreground/80 mb-4 font-serif leading-relaxed">
              "{review.content}"
            </p>
            <footer className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{review.author}</span>
              <span>•</span>
              <span>{review.source}</span>
              {review.rating && (
                <div className="flex items-center ml-auto gap-1 text-amber-500">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{review.rating}/5</span>
                </div>
              )}
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
