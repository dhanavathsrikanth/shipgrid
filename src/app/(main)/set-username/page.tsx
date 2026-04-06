"use client";

import React, { Suspense, lazy, useState, useEffect } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Authenticated } from "convex/react";

// Use lazy + Suspense instead of next/dynamic to reduce aggressive preloading 
// which causes the "preloaded but not used" CSS warning.
const OnboardingView = lazy(() => import("@/views/OnboardingView"));

export default function SetUsernameRoute() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only set mounted after first client render to avoid preloading warnings
    // by deferring the heavy component evaluation.
    setIsMounted(true);
  }, []);

  return (
    <ProtectedLayout>
      <Authenticated>
        {isMounted ? (
          <Suspense fallback={<div className="h-screen animate-pulse bg-muted/10 rounded-lg" />}>
            <OnboardingView />
          </Suspense>
        ) : (
          <div className="h-screen animate-pulse bg-muted/10 rounded-lg" />
        )}
      </Authenticated>
    </ProtectedLayout>
  );
}
