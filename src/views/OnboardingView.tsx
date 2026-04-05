"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function OnboardingView() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setUsernameMutation = useMutation(api.users.setUsername);
  const router = useRouter();
  // useConvexAuth is the correct gate per Convex docs — isAuthenticated is only true
  // AFTER Convex has validated the Clerk JWT, not just when Clerk says the user is loaded.
  const { isAuthenticated } = useConvexAuth();
  const { user: clerkUser } = useUser();

  const convexUser = useQuery(
    api.users.getMyUserDocument,
    isAuthenticated ? {} : "skip"  // ✅ Convex-validated auth gate
  );

  useEffect(() => {
    if (isAuthenticated && convexUser && convexUser.username) {
      // Username already set — redirect to profile
      router.push(`/${convexUser.username}`);
    }
  }, [isAuthenticated, convexUser, router]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
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
      
      // Successfully set username in Convex.
      toast.success("Username reserved!");
      
      // Navigate to personal profile as per Vite logic
      router.push(`/${newTrimmedUsername}`);
    } catch (err: any) {
      console.error("Error setting username:", err);
      setError(
        err.data?.message || err.message || "Failed to set username. It might be taken or invalid."
      );
    }
    setIsLoading(false);
  };

  // Show loading until Convex auth is confirmed AND user doc is fetched
  if (!isAuthenticated || convexUser === undefined || convexUser === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in transition-all duration-500">
        <div className="relative mb-6">
          <div className="h-16 w-16 bg-primary/5 rounded-[24px] border border-primary/10 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 bg-primary rounded-full animate-bounce delay-75" />
          </div>
        </div>
        <h2 className="text-sm font-medium text-muted-foreground animate-pulse">Initializing your account...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="bg-card border-border shadow-sm rounded-lg p-8 md:p-10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col gap-1 mb-8">
              <h1 className="text-lg font-medium tracking-tight text-foreground">Set Your Username</h1>
              <p className="text-sm text-muted-foreground">
                Choose a unique username for your profile. This will be part of your public profile URL.
              </p>
            </div>

            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">Username</Label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-medium text-sm transition-colors group-focus-within:text-primary">@</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="pl-8 h-10 text-sm rounded-md border-border bg-background focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                    placeholder="e.g., janedoe"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="mt-2 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                    {error}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98]"
                disabled={isLoading || !username.trim()}
              >
                {isLoading ? "Saving..." : "Set Username"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
