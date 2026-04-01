"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import PersonalizeView from "@/views/PersonalizeView";

export default function PersonalizePageRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="container mx-auto">
      <PersonalizeView />
    </div>
  );
}
