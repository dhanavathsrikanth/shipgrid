"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import OnboardingView from "@/views/OnboardingView";

export default function SetUsernameRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  return <OnboardingView />;
}
