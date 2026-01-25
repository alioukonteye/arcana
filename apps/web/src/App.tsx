import { useState, useEffect } from 'react';
import { KidsModeProvider } from '@/contexts/KidsModeContext';
import { Layout } from '@/components/Layout';
import { InventoryPage } from '@/pages/InventoryPage';
import { ScannerModal } from '@/components/ScannerModal';
import { AuthGuard } from '@/components/AuthGuard';
import { Routes, Route, useLocation } from 'react-router-dom';
import { BookDetailsPage } from '@/pages/BookDetailsPage';

interface ScanStats {
  detected: number;
  added: number;
  duplicates: number;
  skipped: number;
}

// Scroll to top on route change
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

// Dummy components removed

function AppContent() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastScanStats, setLastScanStats] = useState<ScanStats | null>(null);

  const handleScanSuccess = (stats: ScanStats) => {
    setLastScanStats(stats);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setLastScanStats(null), 10000);
  };

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <Layout onScanClick={() => setIsScannerOpen(true)}>
              <InventoryPage
                refreshTrigger={refreshTrigger}
                lastScanStats={lastScanStats}
              />
            </Layout>
          }
        />
        <Route
          path="/books/:id"
          element={
            <Layout onScanClick={() => setIsScannerOpen(true)}>
              <BookDetailsPage />
            </Layout>
          }
        />
      </Routes>

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={handleScanSuccess}
      />
    </>
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
