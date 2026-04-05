"use client";

import { ProtectedLayout } from "@/components/ProtectedLayout";
import OnboardingView from "@/views/OnboardingView";

// ProtectedLayout wraps children in <Authenticated> from convex/react — per Convex docs,
// this ensures any query inside OnboardingView only fires AFTER Convex has validated the token,
// eliminating the Clerk→Convex race condition window.
export default function SetUsernameRoute() {
  return (
    <ProtectedLayout>
      <OnboardingView />
    </ProtectedLayout>
  );
}
