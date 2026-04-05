"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";

export function UserSyncer() {
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

  return null;
}
