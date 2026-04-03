"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { UserSyncer } from "./UserSyncer";
import { DebugIdentity } from "./DebugIdentity";

const convex = new ConvexReactClient(

  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserSyncer />
      <DebugIdentity />
      {children}
      <Toaster position="bottom-right" closeButton richColors />
    </ConvexProviderWithClerk>

  );
}
