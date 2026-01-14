import { ReactNode, useState } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Switch } from '@/components/ui/switch';
import { useKidsMode } from '@/contexts/KidsModeContext';
import { Sparkles, Camera, Library, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
  onScanClick?: () => void;
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export function Layout({ children, onScanClick, onMenuClick, isMenuOpen }: LayoutProps) {
  const { isKidsMode, toggleKidsMode } = useKidsMode();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
          {/* Left side - Menu + Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Burger Menu - Mobile only */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="md:hidden h-10 w-10"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}

            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                <Library className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">
                  {isKidsMode ? '📚 Mes Livres' : 'Arcana'}
                </h1>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {isKidsMode ? '✨ La bibliothèque familiale' : 'Bibliothèque Familiale'}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Scan Button */}
            {onScanClick && (
              <Button
                onClick={onScanClick}
                size={isKidsMode ? 'lg' : 'default'}
                className="gap-2 h-10 px-3 md:px-4"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isKidsMode ? '📸 Scanner!' : 'Scanner'}
                </span>
              </Button>
            )}

            {/* Kids Mode Toggle */}
            <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground hidden md:inline">
                {isKidsMode ? (
                  <Sparkles className="h-4 w-4 text-yellow-500 inline" />
                ) : (
                  'Enfant'
                )}
              </span>
              <Switch checked={isKidsMode} onCheckedChange={toggleKidsMode} />
              {isKidsMode && <span className="text-sm hidden md:inline">👶</span>}
            </div>

            {/* User Profile */}
            <div className="flex items-center">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    userButtonBox: "h-9 w-9 md:h-10 md:w-10",
                    userButtonAvatarBox: "h-9 w-9 md:h-10 md:w-10 rounded-full border-2 border-primary/10 hover:border-primary/30 transition-colors"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto">
        {children}
      </main>

      {/* Footer - Hidden on mobile for more space */}
      <footer className="border-t bg-card py-3 md:py-4 mt-auto hidden md:block">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          {isKidsMode ? '✨ Bonne lecture ! ✨' : 'Arcana Books © 2026 - Famille Konteye'}
        </div>
      </footer>
    </div>
  );
}
