"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

export function UserSyncer() {
  const { isSignedIn, user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const ensureUserMutation = useMutation(api.users.ensureUser);
  const router = useRouter();

  // Track whether ensureUser has completed — only query Convex user doc after
  // the record is guaranteed to exist, preventing a race where setUsername fires
  // before the user row is created.
  const [ensureUserDone, setEnsureUserDone] = useState(false);

  const convexUserDoc = useQuery(
    api.users.getMyUserDocument,
    isClerkLoaded && isSignedIn && ensureUserDone ? {} : "skip"
  );

  const [isSyncedAndChecked, setIsSyncedAndChecked] = useState(false);

  // Step 1: Run ensureUser once Clerk is ready; only proceed to routing after it resolves
  useEffect(() => {
    if (isClerkLoaded && isSignedIn && clerkUser && !ensureUserDone) {
      ensureUserMutation()
        .then(() => {
          setEnsureUserDone(true);
        })
        .catch((error) => {
          console.error("Error running ensureUser mutation:", error);
          setEnsureUserDone(true); // unblock routing even on error
        });
    }
  }, [isClerkLoaded, isSignedIn, clerkUser, ensureUserMutation, ensureUserDone]);

  const syncUserEmail = useAction(api.clerkSync.syncUserEmail);

  // Step 2: After ensureUser resolves and convexUserDoc is loaded, check for missing data and redirect
  useEffect(() => {
    if (
      isClerkLoaded &&
      isSignedIn &&
      clerkUser &&
      ensureUserDone &&
      convexUserDoc !== undefined &&
      !isSyncedAndChecked
    ) {
      if (convexUserDoc === null) {
        console.warn("UserSyncer: Convex user document is null after ensureUser ran. Waiting for reactivity update...");
        return;
      } else {
        // AUTOMATIC SYNC: If email is missing in Convex, trigger a background sync from Clerk API
        if (!convexUserDoc.email) {
          console.log("UserSyncer: Email missing in Convex, triggering automatic sync from Clerk...");
          syncUserEmail({ clerkId: clerkUser.id }).catch((err: unknown) => {
            console.error("UserSyncer: Automatic email sync failed:", err);
          });
        }

        // REDIRECT: If username is missing, send to the setup page
        if (!convexUserDoc.username) {
          router.push("/set-username");
        }
      }
      setIsSyncedAndChecked(true);
    }

    if (isClerkLoaded && !isSignedIn) {
      setIsSyncedAndChecked(false);
      setEnsureUserDone(false);
    }
  }, [
    isClerkLoaded,
    isSignedIn,
    clerkUser,
    ensureUserDone,
    convexUserDoc,
    router,
    isSyncedAndChecked,
    syncUserEmail,
  ]);

  return null;
}
