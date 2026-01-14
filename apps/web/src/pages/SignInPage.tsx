import { SignIn } from '@clerk/clerk-react';

export function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl border border-gray-100 dark:border-zinc-700 rounded-2xl",
          }
        }}
        signUpUrl={undefined} // Disable signUp if you want strictly invite-only feeling, though Clerk handles it via whitelist effectively
      />
    </div>
  );
}
