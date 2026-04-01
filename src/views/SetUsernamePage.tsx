"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function SetUsernamePage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setUsernameMutation = useMutation(api.users.setUsername);
  const router = useRouter();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  const convexUser = useQuery(
    api.users.getMyUserDocument,
    isClerkLoaded && clerkUser ? {} : "skip"
  );

  useEffect(() => {
    if (isClerkLoaded && convexUser && convexUser.username) {
      router.push("/");
    }
  }, [isClerkLoaded, convexUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    if (!username.trim()) {
      setError("Username cannot be empty.");
      setIsLoading(false);
      return;
    }
    if (!clerkUser) {
      setError("User not authenticated. Please sign in again.");
      setIsLoading(false);
      return;
    }
    try {
      const newTrimmedUsername = username.trim();
      await setUsernameMutation({ newUsername: newTrimmedUsername });
      router.push("/");
    } catch (err: any) {
      console.error("Error setting username:", err);
      setError(err.data?.message || err.message || "Failed to set username. It might be taken or invalid.");
    }
    setIsLoading(false);
  };

  if (!isClerkLoaded || convexUser === undefined) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (convexUser && convexUser.username) {
    return <div className="text-center p-8">Username already set. Redirecting...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg border border-gray-200">
      <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Set Your Username</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Choose a unique username for your profile. This will be part of your public profile URL.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-foreground">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-foreground focus:border-foreground sm:text-sm"
            placeholder="e.g., janedoe"
            required
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Set Username"}
        </button>
      </form>
    </div>
  );
}
