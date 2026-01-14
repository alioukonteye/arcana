import { Lock, LogOut } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

export function RestrictedAccessPage() {
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-900">
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-zinc-700">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Accès Restreint
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Désolé, cette application est une bibliothèque familiale privée réservée aux membres de la famille Konteye.
        </p>

        <Button
          variant="outline"
          onClick={() => signOut()}
          className="w-full gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
