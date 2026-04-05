"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { toast } from "sonner";

export function IcpProfileModal() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getMyUserDocument, isAuthenticated ? {} : "skip");
  const updateIcpProfile = useMutation(api.users.updateIcpProfile);
  const settings = useQuery(api.settings.get);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [role, setRole] = useState("");
  const [problem, setProblem] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (settings?.enableIcpMatching && user && !user.icpComplete) {
      setOpen(true);
    }
  }, [user, settings]);

  const handleSubmit = async () => {
    if (!role || !problem || !budget) {
      toast.error("Please fill in all fields to personalize your feed.");
      return;
    }

    setLoading(true);
    try {
      await updateIcpProfile({
        primaryProblem: problem,
        budgetRange: budget,
        region: "Global",
        role: role,
      });
      toast.success("Profile updated! Your feed is now personalized.");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border-[#1F1F1F] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Personalize Your Feed
          </DialogTitle>
          <p className="text-sm text-gray-400">
            Tell us a bit about yourself so we can match you with the right products and founders.
          </p>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role" className="text-sm font-medium">I am a...</Label>
            <Select onValueChange={setRole} value={role}>
              <SelectTrigger className="bg-[#141414] border-[#1F1F1F]">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1F1F1F] text-white">
                <SelectItem value="founder">Founder / Builder</SelectItem>
                <SelectItem value="investor">Investor (VC/Angel)</SelectItem>
                <SelectItem value="marketer">Marketer / Growth</SelectItem>
                <SelectItem value="engineer">Engineer / Developer</SelectItem>
                <SelectItem value="designer">Designer</SelectItem>
                <SelectItem value="enthusiast">Tech Enthusiast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="problem" className="text-sm font-medium">My current biggest challenge is...</Label>
            <Select onValueChange={setProblem} value={problem}>
              <SelectTrigger className="bg-[#141414] border-[#1F1F1F]">
                <SelectValue placeholder="What are you working on?" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1F1F1F] text-white">
                <SelectItem value="acquisition">User Acquisition</SelectItem>
                <SelectItem value="scaling">Technical Scaling</SelectItem>
                <SelectItem value="funding">Raising Capital</SelectItem>
                <SelectItem value="hiring">Hiring Talent</SelectItem>
                <SelectItem value="monetization">Monetization</SelectItem>
                <SelectItem value="productivity">General Productivity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budget" className="text-sm font-medium">My typical software budget is...</Label>
            <Select onValueChange={setBudget} value={budget}>
              <SelectTrigger className="bg-[#141414] border-[#1F1F1F]">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1F1F1F] text-white">
                <SelectItem value="zero">$0 (Free tools only)</SelectItem>
                <SelectItem value="low">$1 - $50 / mo</SelectItem>
                <SelectItem value="mid">$50 - $500 / mo</SelectItem>
                <SelectItem value="high">$500+ / mo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Start Matching"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
