"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";

export function UserSyncer({ children }: { children: React.ReactNode }) {
  const { user: clerkUser } = useUser(); // keep for clerkUser data access
  // Per Clerk+Convex docs: use useConvexAuth for Convex operation gates
  // isAuthenticated = true only after Convex backend has validated the token
  const { isAuthenticated } = useConvexAuth();
  const ensureUserMutation = useMutation(api.users.ensureUser);
  const router = useRouter();
  const pathname = usePathname();

  const convexUserDoc = useQuery(
    api.users.getMyUserDocument,
    isAuthenticated ? {} : "skip"
  );

  const [hasRunEnsure, setHasRunEnsure] = useState(false);
  const [ensureSuccess, setEnsureSuccess] = useState(false);
  const [isSyncedAndChecked, setIsSyncedAndChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated && clerkUser && !hasRunEnsure) {
      setHasRunEnsure(true);
      ensureUserMutation()
        .then(() => {
          setEnsureSuccess(true);
        })
        .catch((error) => {
          console.error("Error running ensureUser mutation:", error);
          setHasRunEnsure(false); // Can retry if it was a transient error
        });
    }
  }, [isAuthenticated, clerkUser, ensureUserMutation, hasRunEnsure]);

  useEffect(() => {
    // Only proceed if ensureUser succeeded AND the query sees the updated doc
    if (isAuthenticated && ensureSuccess && convexUserDoc !== undefined && !isSyncedAndChecked) {
      if (convexUserDoc === null) {
        // The index hasn't caught up to the mutation yet. Wait.
      } else {
        if (!convexUserDoc.username && pathname !== "/set-username") {
          router.push("/set-username");
        }
        setIsSyncedAndChecked(true);
      }
    }
    
    if (!isAuthenticated) {
      setIsSyncedAndChecked(false);
      setHasRunEnsure(false);
      setEnsureSuccess(false);
    }
  }, [isAuthenticated, ensureSuccess, convexUserDoc, router, isSyncedAndChecked, pathname]);

  // Block rendering of the application until the backend has finished storing the user
  const isSyncing = isAuthenticated && !ensureSuccess;

  return (
    <>
      {isSyncing ? (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-tight">Authenticating securely...</p>
        </div>
      ) : (
        children
      )}
    </>
  );
}
