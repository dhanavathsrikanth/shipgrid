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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="relative p-1 rounded-[40px] bg-gradient-to-b from-indigo-500/20 to-transparent">
          <div className="bg-card border shadow-2xl rounded-[38px] p-8 md:p-12 overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                  <div className="relative p-5 rounded-[24px] bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                    <User size={48} />
                  </div>
                </div>
              </div>
              
              <h1 className="text-4xl font-extrabold text-center mb-3 tracking-tight text-foreground">Pick your handle</h1>
              <p className="text-muted-foreground text-center mb-10 text-lg">
                This is how you'll be known in the Shipgrid community.
              </p>

              <form onSubmit={handleUsernameSubmit} className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Unique Username</Label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/50 font-bold text-2xl group-focus-within:text-indigo-600 transition-colors">@</span>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="pl-14 bg-muted/30 border-2 border-transparent focus:border-indigo-500/50 h-16 text-xl rounded-[24px] transition-all font-bold placeholder:text-muted-foreground/30"
                      placeholder="super_builder"
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                      <X size={18} />
                      <p className="text-sm font-bold">{error}</p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-16 text-xl font-black rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 group transition-all active:scale-95"
                  disabled={isLoading || !username.trim()}
                >
                  {isLoading ? "Checking availability..." : "Continue Onboarding"}
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </div>
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-[60px]" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-500/5 rounded-full blur-[60px]" />
          </div>
        </div>

        <div className="mt-10 px-6 py-4 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <CheckCircle2 size={16} className="text-green-500" />
            Verified by Shipgrid Auth
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
