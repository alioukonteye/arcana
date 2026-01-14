import React, { useState, useRef } from 'react';
import { Camera, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming standard shadcn utils, will create if missing



export const Scanner = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:3000/books/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Scan failed');

      const result = await response.json();
      setScanResult(result);
    } catch (err) {
      console.error(err);
      setError('Could not identify book. Try again?');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 w-full max-w-md mx-auto">
      <div
        className={cn(
          "relative w-64 h-80 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center transition-all",
          isScanning ? "border-blue-500 bg-blue-50/10" : "border-slate-300 bg-slate-50 dark:bg-slate-900"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleCapture}
        />

        {isScanning ? (
          <div className="flex flex-col items-center animate-pulse text-blue-500">
            <Loader2 className="w-12 h-12 animate-spin mb-2" />
            <span className="text-sm font-medium">Identifying...</span>
          </div>
        ) : scanResult ? (
          <div className="flex flex-col items-center text-center p-4 animate-in fade-in zoom-in duration-300 w-full">
            <BookOpen className="w-12 h-12 text-green-500 mb-2" />
            <h3 className="font-bold text-lg">{scanResult.message}</h3>

            {scanResult.stats && (
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                {scanResult.stats.added > 0 && <p className="text-green-600">+{scanResult.stats.added} ajouté(s)</p>}
                {scanResult.stats.duplicates > 0 && <p className="text-yellow-600">{scanResult.stats.duplicates} doublon(s) ignoré(s)</p>}
              </div>
            )}

            {scanResult.books && scanResult.books.length > 0 && (
              <div className="mt-4 w-full text-left max-h-40 overflow-y-auto bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs">
                {scanResult.books.map((b: any, i: number) => (
                  <div key={i} className="flex justify-between py-1 border-b last:border-0 border-slate-200 dark:border-slate-700">
                    <span className="truncate flex-1 font-medium">{b.title}</span>
                    <span className="text-slate-500 ml-2">{b.isNewBook ? '🆕' : '⚠️'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-400">
            <Camera className="w-12 h-12 mb-2" />
            <span className="text-sm font-medium">Tap to Scan Book</span>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg w-full text-center">
          {error}
        </div>
      )}
    </div>
  );
};
