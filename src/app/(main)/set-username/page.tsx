"use client";

import React, { Suspense, lazy } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Authenticated } from "convex/react";

// Use lazy + Suspense instead of next/dynamic to reduce aggressive preloading 
// which causes the "preloaded but not used" CSS warning.
const OnboardingView = lazy(() => import("@/views/OnboardingView"));

export default function SetUsernameRoute() {
  return (
    <ProtectedLayout>
      <Authenticated>
        <Suspense fallback={<div className="h-screen animate-pulse bg-muted/10 rounded-lg" />}>
          <OnboardingView />
        </Suspense>
      </Authenticated>
    </ProtectedLayout>
  );
}
