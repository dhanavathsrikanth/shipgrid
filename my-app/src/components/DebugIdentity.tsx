"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function DebugIdentity() {
  const { user: clerkUser } = useUser();
  const convexIdentity = useQuery(api.users.debugMyIdentity);
  const convexUserDoc = useQuery(api.users.getMyUserDocument);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] max-w-md rounded-lg border border-red-500/30 bg-black/90 p-4 text-[10px] font-mono text-white shadow-2xl backdrop-blur-md">
      <h3 className="mb-2 border-b border-white/20 pb-1 font-bold text-red-400">
        IDS & IDENTITY DEBUG
      </h3>
      
      <div className="space-y-4">
        <section>
          <div className="text-blue-400">CLERK CLIENT SDK</div>
          <div>ID: {clerkUser?.id || "null"}</div>
          <div>Email: {clerkUser?.primaryEmailAddress?.emailAddress || "null"}</div>
        </section>

        <section>
          <div className="text-green-400">CONVEX SERVER IDENTITY</div>
          <div>Subject (clerkId): {convexIdentity?.subject || "null"}</div>
          <div>Issuer: {convexIdentity?.issuer || "null"}</div>
          <div className="mt-1 text-[8px] text-gray-400">
            {convexIdentity ? "Token Validated" : "No Identity / Token Rejected"}
          </div>
        </section>

        <section>
          <div className="text-purple-400">CONVEX DATABASE RECORD</div>
          <div>Status: {convexUserDoc ? "FOUND" : "NOT FOUND (NULL)"}</div>
          {convexUserDoc && (
            <>
              <div>_id: {convexUserDoc._id}</div>
              <div>clerkId in DB: {convexUserDoc.clerkId}</div>
              <div>Is Banned: {String(convexUserDoc.isBanned)}</div>
            </>
          )}
        </section>

        {!convexUserDoc && convexIdentity && (
          <div className="mt-2 rounded bg-red-900/50 p-2 text-red-200">
            CRITICAL: Identity subject exists but no DB record matches. 
            Run "ensureUser" or check for extra spaces in "clerkId".
          </div>
        )}
      </div>
    </div>
  );
}
