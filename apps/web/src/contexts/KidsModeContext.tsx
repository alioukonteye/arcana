import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface KidsModeContextType {
  isKidsMode: boolean;
  toggleKidsMode: () => void;
}

const KidsModeContext = createContext<KidsModeContextType | undefined>(undefined);

export function KidsModeProvider({ children }: { children: ReactNode }) {
  const [isKidsMode, setIsKidsMode] = useState(() => {
    const saved = localStorage.getItem('arcana-kids-mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('arcana-kids-mode', String(isKidsMode));

    // Toggle CSS class on document
    if (isKidsMode) {
      document.documentElement.classList.add('kids-mode');
    } else {
      document.documentElement.classList.remove('kids-mode');
    }
  }, [isKidsMode]);

  const toggleKidsMode = () => setIsKidsMode(prev => !prev);

  return (
    <KidsModeContext.Provider value={{ isKidsMode, toggleKidsMode }}>
      {children}
    </KidsModeContext.Provider>
  );
}

export function useKidsMode() {
  const context = useContext(KidsModeContext);
  if (!context) {
    throw new Error('useKidsMode must be used within a KidsModeProvider');
  }
  return context;
}
