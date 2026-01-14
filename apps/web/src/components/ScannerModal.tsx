import { useRef, useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, CheckCircle, XCircle, Upload, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKidsMode } from '@/contexts/KidsModeContext';

interface ScanStats {
  detected: number;
  added: number;
  duplicates: number;
  skipped: number;
}

interface ScanResult {
  success: boolean;
  message: string;
  books: Array<{
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    confidence: number;
    isNewBook: boolean;
    copyNumber?: number;
  }>;
  stats: ScanStats;
}

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (stats: ScanStats) => void;
}

export function ScannerModal({ isOpen, onClose, onSuccess }: ScannerModalProps) {
  const { isKidsMode } = useKidsMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const { request } = useApi();

  const loadingMessages = [
    { text: "Envoi de l'image...", duration: 2000 },
    { text: "Analyse par l'IA...", duration: 8000 },
    { text: "Identification des livres...", duration: 5000 },
    { text: "Récupération des détails...", duration: 4000 },
    { text: "Finalisation...", duration: 2000 }
  ];

  const kidsLoadingMessages = [
    { text: "🚀 J'envoie ta photo...", duration: 2000 },
    { text: "🤖 Le robot regarde...", duration: 8000 },
    { text: "📚 Je compte les livres...", duration: 5000 },
    { text: "✨ Presque fini !", duration: 4000 }
  ];

  useEffect(() => {
    if (!isScanning) {
      setLoadingStep(0);
      return;
    }

    let currentStep = 0;
    const messages = isKidsMode ? kidsLoadingMessages : loadingMessages;

    const runStep = () => {
      if (currentStep >= messages.length - 1) return;

      const timer = setTimeout(() => {
        currentStep++;
        setLoadingStep(currentStep);
        runStep();
      }, messages[currentStep].duration);

      return timer;
    };

    const timer = runStep();
    return () => clearTimeout(timer);
  }, [isScanning, isKidsMode]);

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const data = await request<ScanResult>('/books/scan', {
        method: 'POST',
        body: formData,
      });

      setResult(data);

      if (data.success && data.books.length > 0) {
        setTimeout(() => {
          onSuccess(data.stats);
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      setResult({
        success: false,
        message: 'Erreur lors du scan',
        books: [],
        stats: { detected: 0, added: 0, duplicates: 0, skipped: 0 },
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {isKidsMode ? '📸 Scanne ton étagère !' : 'Scanner une étagère'}
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                {isKidsMode
                  ? 'Prends une photo de tes livres !'
                  : 'Prenez une photo de votre étagère pour ajouter tous les livres automatiquement'}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div
                onClick={() => !isScanning && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isScanning
                    ? 'border-muted bg-muted/30 cursor-wait'
                    : 'cursor-pointer hover:border-primary'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleCapture}
                  disabled={isScanning}
                />

                {isScanning ? (
                  <div className="flex flex-col items-center gap-4 text-primary py-4">
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-lg font-medium animate-pulse">
                        {isKidsMode
                          ? kidsLoadingMessages[Math.min(loadingStep, kidsLoadingMessages.length - 1)].text
                          : loadingMessages[Math.min(loadingStep, loadingMessages.length - 1)].text}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isKidsMode ? 'Patience...' : 'Ne fermez pas la fenêtre'}
                      </p>
                    </div>
                    {/* Progress Bar inspired visual */}
                    <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-2">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: 20,
                          ease: "linear",
                          repeat: 0
                        }}
                      />
                    </div>
                  </div>
                ) : result ? (
                  <div className="flex flex-col items-center gap-3">
                    {result.success ? (
                      <>
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="font-medium text-green-600">{result.message}</p>

                        {/* Stats */}
                        <div className="flex gap-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            📚 {result.stats.detected} détectés
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            ✅ {result.stats.added} ajoutés
                          </span>
                          {result.stats.duplicates > 0 && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                              📑 {result.stats.duplicates} copies
                            </span>
                          )}
                        </div>

                        {/* Book List */}
                        {result.books.length > 0 && (
                          <ScrollArea className="h-40 w-full mt-4">
                            <div className="space-y-2">
                              {result.books.map((book) => (
                                <div
                                  key={book.id}
                                  className="flex items-center gap-2 p-2 bg-muted rounded text-left"
                                >
                                  {book.coverUrl ? (
                                    <img
                                      src={book.coverUrl}
                                      alt={book.title}
                                      className="w-8 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-8 h-12 bg-muted-foreground/20 rounded flex items-center justify-center">
                                      <BookOpen className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{book.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {book.author}
                                    </p>
                                  </div>
                                  {book.isNewBook ? (
                                    <span className="text-xs text-green-600">Nouveau</span>
                                  ) : (
                                    <span className="text-xs text-yellow-600">
                                      Copie #{book.copyNumber}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-12 w-12 text-red-500" />
                        <p className="font-medium text-red-500">{result.message}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    {isKidsMode ? (
                      <>
                        <Camera className="h-16 w-16" />
                        <p className="text-lg font-medium">Photo de l'étagère ! 📷</p>
                        <p className="text-sm">Clique ici pour scanner tes livres</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12" />
                        <p className="font-medium">Photographiez votre étagère</p>
                        <p className="text-sm">
                          Tous les livres visibles seront identifiés et ajoutés
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <Button variant="outline" onClick={handleClose} className="w-full" disabled={isScanning}>
                {isKidsMode ? '❌ Fermer' : 'Fermer'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
