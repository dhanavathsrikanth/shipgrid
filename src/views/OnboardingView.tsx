"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, ArrowRight, CheckCircle2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function OnboardingView() {
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
    if (isClerkLoaded && convexUser) {
        if (convexUser.username) {
            // If username exists but ICP is not complete, go to personalize
            if (!convexUser.icpComplete) {
              router.push("/personalize");
            } else {
              router.push("/");
            }
        }
    }
  }, [isClerkLoaded, convexUser, router]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!username.trim()) {
      setError("Username cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      await setUsernameMutation({ newUsername: username.trim() });
      toast.success("Username reserved!");
      // Redirect to the dedicated personalization page
      router.push("/personalize");
    } catch (err: any) {
      setError(err.data?.message || err.message || "Failed to set username.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClerkLoaded || convexUser === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-20 w-20 bg-indigo-500/10 rounded-[32px]" />
          <div className="h-4 w-32 bg-muted rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="bg-card border-border shadow-sm rounded-lg p-8 md:p-10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col gap-1 mb-8">
              <h1 className="text-lg font-medium tracking-tight text-foreground">Pick your handle</h1>
              <p className="text-sm text-muted-foreground">
                This is how you'll be known in the Shipgrid community.
              </p>
            </div>

            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">Unique Username</Label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-medium text-sm transition-colors group-focus-within:text-primary">@</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="pl-8 h-10 text-sm rounded-md border-border bg-background focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                    placeholder="super_builder"
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
                {isLoading ? "Checking..." : "Continue"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
