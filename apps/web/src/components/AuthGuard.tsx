import { useUser, useAuth } from '@clerk/clerk-react';
import { ReactNode } from 'react';

import { Loader2 } from 'lucide-react';
import { SignInPage } from '@/pages/SignInPage';
import { RestrictedAccessPage } from '@/pages/RestrictedAccessPage';

// Whitelist configuration (Frontend check for UX)
const ALLOWED_EMAILS = [
  'aliou.konteye@gmail.com',
  'yourlittlenini@gmail.com'
];

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInPage />;
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
    return <RestrictedAccessPage />;
  }

  return <>{children}</>;
}
