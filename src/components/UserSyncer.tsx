"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

export function UserSyncer() {
  const { isSignedIn, user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const ensureUserMutation = useMutation(api.users.ensureUser);
  const router = useRouter();

  const convexUserDoc = useQuery(
    api.users.getMyUserDocument,
    isClerkLoaded && isSignedIn ? {} : "skip"
  );

  const [isSyncedAndChecked, setIsSyncedAndChecked] = useState(false);

  useEffect(() => {
    if (isClerkLoaded && isSignedIn && clerkUser && !isSyncedAndChecked) {
      ensureUserMutation()
        .then(() => {})
        .catch((error) => {
          console.error("Error running ensureUser mutation:", error);
        });
    }
  }, [isClerkLoaded, isSignedIn, clerkUser, ensureUserMutation, isSyncedAndChecked]);

  useEffect(() => {
    if (isClerkLoaded && isSignedIn && convexUserDoc !== undefined && !isSyncedAndChecked) {
      if (convexUserDoc === null) {
        console.warn("UserSyncer: Convex user document is null after ensureUser should have run.");
      } else if (convexUserDoc.username === null || convexUserDoc.username === undefined) {
        router.push("/set-username");
      }
      setIsSyncedAndChecked(true);
    }
    if (isClerkLoaded && !isSignedIn) {
      setIsSyncedAndChecked(false);
    }
  }, [isClerkLoaded, isSignedIn, convexUserDoc, router, isSyncedAndChecked]);

  return null;
}
