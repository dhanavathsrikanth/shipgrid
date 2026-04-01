"use client";

import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  return <>{children}</>;
}
