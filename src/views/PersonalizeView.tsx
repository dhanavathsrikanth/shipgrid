"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Target, Wallet, CheckCircle2, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";
import { Card } from "@/components/ui/card";

export default function PersonalizeView() {
  const router = useRouter();
  const user = useQuery(api.users.getMyUserDocument);
  const options = useQuery(api.icp.getOptions);
  const updateIcpProfile = useMutation(api.users.updateIcpProfile);
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [problem, setProblem] = useState("");
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.icpRoles && selectedRoles.length === 0) {
      setSelectedRoles(user.icpRoles);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (selectedRoles.length === 0 || !problem || !budget) {
      toast.error("Please fill in all personalization fields.");
      return;
    }

    setIsLoading(true);
    try {
      await updateIcpProfile({
        primaryProblem: problem,
        budgetRange: budget,
        region: "Global",
        icpRoles: selectedRoles,
      });
      toast.success("Feed Personality Optimized!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (options === undefined || user === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-tight animate-pulse text-muted-foreground">Syncing Discovery Preferences...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 selection:bg-primary/30">
      <div className="w-full max-w-lg">
        <div className="relative p-1 rounded-[32px] bg-gradient-to-b from-primary/20 to-transparent shadow-2xl shadow-primary/5">
          <Card className="bg-card border-none shadow-none rounded-[30px] p-8 md:p-10 overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:scale-110 transition-transform" />
                  <div className="relative p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Sparkles size={32} className="animate-pulse" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-center mb-2 tracking-tight title-font text-foreground">Personalize Feed</h1>
              <p className="text-sm font-medium text-muted-foreground text-center mb-8 leading-relaxed">
                Fine-tune your discovery experience to match your professional profile.
              </p>

              <div className="space-y-6">
                {/* Multi-Role Selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={16} className="text-primary" />
                    <Label className="text-sm font-semibold text-foreground">Professional Roles</Label>
                  </div>
                  <MultiSelect 
                    options={options.roles}
                    selected={selectedRoles}
                    onChange={setSelectedRoles}
                    placeholder="Identify your builder profile..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Problem Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={16} className="text-indigo-500" />
                      <Label className="text-sm font-semibold text-foreground">Primary Challenge</Label>
                    </div>
                    <Select onValueChange={setProblem} value={problem}>
                      <SelectTrigger className="bg-muted/30 border-input h-11 rounded-xl text-sm font-semibold transition-all hover:bg-muted/50">
                        <SelectValue placeholder="What are you solving for?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl p-1 border shadow-2xl">
                        {options.challenges.map(c => (
                          <SelectItem key={c} value={c} className="rounded-lg my-0.5 text-sm font-semibold transition-colors">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet size={16} className="text-pink-500" />
                      <Label className="text-sm font-semibold text-foreground">Spending Tier</Label>
                    </div>
                    <Select onValueChange={setBudget} value={budget}>
                      <SelectTrigger className="bg-muted/30 border-input h-11 rounded-xl text-sm font-semibold transition-all hover:bg-muted/50">
                        <SelectValue placeholder="Subscription budget..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl p-1 border shadow-2xl">
                        {options.budgets.map(b => (
                          <SelectItem key={b} value={b} className="rounded-lg my-0.5 text-sm font-semibold transition-colors">{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <Button
                    onClick={handleSubmit}
                    className="w-full h-11 text-base font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-lg shadow-foreground/5 group transition-all active:scale-95"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving Discovery Feed..." : "Boost Personalization"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Subtle Design accents */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          </Card>
        </div>

        <div className="mt-8 px-6 py-4 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center gap-3 text-xs text-muted-foreground font-bold transition-all hover:border-primary/20">
          <CheckCircle2 size={16} className="text-primary" />
          Shipgrid matching engine prioritized for your profile
        </div>
      </div>
    </div>
  );
}
