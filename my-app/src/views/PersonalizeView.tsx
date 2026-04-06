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
    if (user) {
      if (user.icpRoles && selectedRoles.length === 0) {
        setSelectedRoles(user.icpRoles);
      }
      if (user.primaryProblem && !problem) {
        setProblem(user.primaryProblem);
      }
      if (user.budgetRange && !budget) {
        setBudget(user.budgetRange);
      }
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
    } catch (error: any) {
      console.error("updateIcpProfile error:", error);
      toast.error(error?.data?.message || error?.message || "Failed to update profile.");
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="bg-card border-border shadow-sm rounded-lg p-8 md:p-10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col gap-1 mb-8">
              <h1 className="text-lg font-medium tracking-tight text-foreground">Personalize Feed</h1>
              <p className="text-sm text-muted-foreground">
                Fine-tune your discovery experience to match your professional profile.
              </p>
            </div>

            <div className="space-y-6">
              {/* Multi-Role Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Professional Roles</Label>
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
                  <Label className="text-sm font-medium text-foreground">Primary Challenge</Label>
                  <Select onValueChange={setProblem} value={problem}>
                    <SelectTrigger className="h-10 rounded-md border-border bg-background text-sm transition-all">
                      <SelectValue placeholder="What are you solving for?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border shadow-lg">
                      {options.challenges.map(c => (
                        <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Spending Tier</Label>
                  <Select onValueChange={setBudget} value={budget}>
                    <SelectTrigger className="h-10 rounded-md border-border bg-background text-sm transition-all">
                      <SelectValue placeholder="Subscription budget..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border shadow-lg">
                      {options.budgets.map(b => (
                        <SelectItem key={b} value={b} className="text-sm">{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-6 border-t border-border">
                <Button
                  onClick={handleSubmit}
                  className="w-full h-10 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Preferences"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => router.push("/")}
                  className="w-full h-10 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
                  disabled={isLoading}
                >
                  Skip for now
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
