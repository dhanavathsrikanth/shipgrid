"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";
import { UserSyncer } from "./UserSyncer";

// Runtime guard — matches Clerk official docs pattern (image 2, lines 8-10)
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {/* Project-specific: syncs Clerk user to Convex DB on sign-in before rendering children */}
      <UserSyncer>
        {children}
      </UserSyncer>
    </ConvexProviderWithClerk>
  );
}
