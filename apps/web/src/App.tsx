import { useState } from 'react';
import { KidsModeProvider } from '@/contexts/KidsModeContext';
import { Layout } from '@/components/Layout';
import { InventoryPage } from '@/pages/InventoryPage';
import { ScannerModal } from '@/components/ScannerModal';
import { AuthGuard } from '@/components/AuthGuard';


interface ScanStats {
  detected: number;
  added: number;
  duplicates: number;
  skipped: number;
}

import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { BookDetailsPage } from '@/pages/BookDetailsPage';

function AppContent() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastScanStats, setLastScanStats] = useState<ScanStats | null>(null);

  const handleScanSuccess = (stats: ScanStats) => {
    setLastScanStats(stats);
    setRefreshTrigger(prev => prev + 1);

    // Clear stats after 10 seconds
    setTimeout(() => setLastScanStats(null), 10000);
  };

  return (
    <BrowserRouter>
      <Layout
        onScanClick={() => setIsScannerOpen(true)}
      >
        <Routes>
          <Route
            path="/"
            element={
              <InventoryPage
                refreshTrigger={refreshTrigger}
                lastScanStats={lastScanStats}
                // isMenuOpen not needed anymore
                isMenuOpen={false}
                onMenuClose={() => { }}
              />
            }
          />
          <Route path="/books/:id" element={<BookDetailsPage />} />
        </Routes>

        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSuccess={handleScanSuccess}
        />
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <KidsModeProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </KidsModeProvider>

  );
}

export default App;
