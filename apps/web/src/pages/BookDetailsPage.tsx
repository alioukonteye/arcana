import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Need to check if Avatar component exists or use base HTML
import {
  ChevronLeft,
  BookOpen,
  Clock,
  Sparkles,
  Share2,
  Lock,
  User
} from 'lucide-react';
import { useKidsMode } from '@/contexts/KidsModeContext';
import { ReviewSection } from '@/components/ReviewSection';
import { useApi } from '@/lib/api';



export function BookDetailsPage() {
  const { request } = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isKidsMode } = useKidsMode();

  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<'READ' | 'TO_READ' | 'READING' | 'WISHLIST'>('TO_READ');
  const [loanedTo, setLoanedTo] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;

      try {
        const userId = "ALIOU"; // Mock current user
        const data = await request<{ success: boolean; data: any }>(`/books/${id}?userId=${userId}`);
        if (data.success) {
          setBook(data.data);
          setUserStatus(data.data.status);
        }
      } catch (err) {
        console.error('Failed to fetch book:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]); // request is stable from useApi, so we don't need to include it

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) return;

    try {
      await request(`/books/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  if (loading || !book) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  const isRead = userStatus === 'READ';
  const isWishlist = book.status === 'WISHLIST';

  const handleLoan = async () => {
    // Simple prompt flow as requested
    const name = prompt("À qui prêtez-vous ce livre ? (Laisser vide pour signaler le retour)");
    if (name === null) return; // Cancelled

    if (name.trim() === '') {
      // Return book
      try {
        const response = await request<{ success: boolean; data: any }>(`/books/${id}/loan`, {
          method: 'PATCH',
          body: { loanedTo: null, loanDate: null }
        });
        if (response.success) {
          setLoanedTo(null);
        }
      } catch (err) {
        console.error(err);
        alert('Erreur lors du retour.');
      }
      return;
    }

    // Lending
    const defaultDate = new Date().toISOString().split('T')[0];
    const dateStr = prompt("Date du prêt (AAAA-MM-JJ)", defaultDate);

    // If user cancels date, we still proceed? Or cancel?
    // Let's assume default if they cancel or empty, or stick to provided.
    // Actually if they cancel the 2nd prompt, maybe they want to cancel everything?
    // Let's use default if empty/cancelled to be safe/quick.
    const finalDate = dateStr ? dateStr : defaultDate;

    try {
      const response = await request<{ success: boolean; data: any }>(`/books/${id}/loan`, {
        method: 'PATCH',
        body: {
          loanedTo: name,
          loanDate: new Date(finalDate).toISOString()
        }
      });

      if (response.success) {
        setLoanedTo(response.data.loanedTo);
      }
    } catch (err) {
      console.error('Failed to update loan status:', err);
      alert('Impossible de mettre à jour le prêt.');
    }
  };

  const handleMemberRead = async (userId: string) => {
    try {
      const response = await request<{ success: boolean; data: any }>(`/books/${id}/reading-status`, {
        method: 'POST',
        body: { userId, status: 'READ' }
      });

      if (response.success) {
        if (userId === 'ALIOU') {
          setUserStatus('READ');
        }
        // Refresh book data
        const currentUserId = 'ALIOU';
        const bookData = await request<{ success: boolean; data: any }>(`/books/${id}?userId=${currentUserId}`);
        if (bookData.success) {
          setBook(bookData.data);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleMarkAsRead = () => handleMemberRead('ALIOU');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Nav */}
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="-ml-2 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
            {isKidsMode ? 'Retour' : 'Bibliothèque'}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Cover */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div className="aspect-[2/3] rounded-lg shadow-2xl overflow-hidden bg-muted relative">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {isWishlist ? (
                <Button
                  className="w-full bg-[#FF9900] hover:bg-[#ffad33] text-black font-medium"
                  onClick={() => window.open(`https://www.amazon.fr/s?k=${encodeURIComponent(book.isbn || `${book.title} ${book.author}`)}`, '_blank')}
                >
                  Acheter sur Amazon
                </Button>
              ) : (
                <Button
                  variant={loanedTo ? "secondary" : "outline"}
                  className="w-full justify-between"
                  onClick={handleLoan}
                >
                  <span className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    {loanedTo ? 'Prêté à' : 'Prêter ce livre'}
                  </span>
                  {loanedTo && <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{loanedTo}</Badge>}
                </Button>
              )}


            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground mb-2">
                {book.title}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-light">
                {book.author}
              </p>
              {isWishlist && book.addedBy && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Demandé par {book.addedBy.name}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-8">
              <Badge
                variant={isRead ? "default" : "secondary"}
                className={`text-sm px-3 py-1 ${isRead ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {isRead ? (
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Lu</span>
                ) : (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> À lire</span>
                )}
              </Badge>
              {book.status === 'READING' && <Badge variant="secondary">En cours</Badge>}
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              <p className="lead">{book.summary}</p>
            </div>

            {/* Readers Section */}
            <div className="border-t pt-6 mt-auto">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Lecteurs de la famille
              </h3>
              <div className="flex gap-2">
                {book.readers.map((reader: any) => (
                  <div key={reader.name} className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-background">
                      {reader.name.charAt(0)}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{reader.name}</span>
                  </div>
                ))}

                <Dialog>
                  <DialogTrigger asChild>
                    <button className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                      <span className="text-xs font-medium">+</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Qui a lu ce livre ?</DialogTitle>
                      <DialogDescription>
                        Cliquez sur un membre pour ajouter ou retirer de la liste des lecteurs.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      {['ALIOU', 'SYLVIA', 'SACHA', 'LISA'].map((member) => {
                        const isReader = book.readers.some((r: any) => r.name.toUpperCase() === member);
                        return (
                          <Button
                            key={member}
                            variant={isReader ? "default" : "outline"}
                            className="h-16 flex flex-col gap-1 relative"
                            onClick={async () => {
                              const newStatus = isReader ? 'TO_READ' : 'READ';
                              try {
                                const response = await request<{ success: boolean; data: any }>(`/books/${id}/reading-status`, {
                                  method: 'POST',
                                  body: { userId: member, status: newStatus }
                                });
                                if (response.success) {
                                  // Force reload to update list
                                  const bookData = await request<{ success: boolean; data: any }>(`/books/${id}?userId=ALIOU`);
                                  if (bookData.success) {
                                    setBook(bookData.data);
                                    setUserStatus(bookData.data.status);
                                  }
                                }
                              } catch (e) { console.error(e); }
                            }}
                          >
                            <span className="text-2xl">
                              {member === 'ALIOU' ? '👨' : member === 'SYLVIA' ? '👩' : member === 'SACHA' ? '👦' : '👧'}
                            </span>
                            <span className="capitalize">{member.toLowerCase()}</span>
                            {isReader && <span className="absolute top-2 right-2 text-xs">✓</span>}
                          </Button>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Spoiler AI Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className={`h-6 w-6 ${isRead ? 'text-purple-500' : 'text-muted-foreground'}`} />
            <h2 className="text-2xl font-serif font-bold">Analyse Arcana</h2>
            {!isRead && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
          </div>

          {isRead ? (
            /* UNLOCKED CONTENT */
            <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-background border rounded-xl p-8 shadow-sm">
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-purple-900 dark:text-purple-100">L'avis de l'IA</h3>
                <p className="text-lg leading-relaxed text-foreground/90 font-serif">
                  {book.aiNotes?.analysis || "Analyse en cours de génération..."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Thèmes clés</h4>
                  <div className="flex flex-wrap gap-2">
                    {(book.aiNotes?.themes || ["Non analysé"]).map((theme: string) => (
                      <Badge key={theme} variant="outline" className="px-3 py-1 border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Questions de discussion</h4>
                  <ul className="space-y-3">
                    {(book.aiNotes?.questions || ["Pas de questions disponibles"]).map((q: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* LOCKED CONTENT */
            <div className="relative overflow-hidden rounded-xl border bg-muted/30 p-8 text-center">
              <div className="absolute inset-0 bg-grid-slate-200/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))]" />
              <div className="relative z-10 py-12 flex flex-col items-center max-w-md mx-auto">
                <Lock className="h-12 w-12 text-muted-foreground/50 mb-6" />
                <h3 className="text-xl font-semibold mb-2">Analyse verrouillée</h3>
                <p className="text-muted-foreground mb-6">
                  Pour éviter les spoilers, l'analyse détaillée et les thèmes de ce livre sont masqués tant que vous ne l'avez pas marqué comme "Lu".
                </p>
                <Button variant="outline" className="gap-2" onClick={handleMarkAsRead}>
                  <BookOpen className="h-4 w-4" />
                  Marquer comme lu
                </Button>
              </div>
            </div>
          )}
        </section>

        <Separator className="my-12" />

        {/* Reviews Section */}
        <ReviewSection reviews={book.reviews} />

        <div className="mt-16 mb-8 flex justify-center opacity-40 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
          >
            Supprimer ce livre
          </Button>
        </div>

      </div>
    </div>
  );
}
