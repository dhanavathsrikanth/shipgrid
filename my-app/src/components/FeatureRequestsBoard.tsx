"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ChevronUp,
  Plus,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface FeatureRequestsBoardProps {
  storyId: Id<"stories">;
  isOwner: boolean;
}

const STATUS_CONFIG = {
  open:     { label: "Open",     icon: Clock,         className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  planned:  { label: "Planned",  icon: CheckCircle2,  className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  shipped:  { label: "Shipped",  icon: Package,       className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  declined: { label: "Declined", icon: XCircle,       className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function FeatureRequestsBoard({ storyId, isOwner }: FeatureRequestsBoardProps) {
  const { isSignedIn } = useAuth();
  const requests = useQuery(api.featureRequests.listByStory, { storyId });
  const submitReq = useMutation(api.featureRequests.submit);
  const voteReq = useMutation(api.featureRequests.voteRequest);
  const updateStatusMut = useMutation(api.featureRequests.updateStatus);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) { toast.error("Sign in to submit a request."); return; }
    if (!title.trim()) return;
    setLoading(true);
    try {
      await submitReq({ storyId, title, description: description || undefined });
      toast.success("Request submitted!");
      setTitle(""); setDescription(""); setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request.");
    } finally { setLoading(false); }
  };

  const handleVote = async (requestId: Id<"featureRequests">) => {
    if (!isSignedIn) { toast.error("Sign in to upvote."); return; }
    try { await voteReq({ requestId }); }
    catch (err: any) { toast.error(err.message || "Failed to vote."); }
  };

  const handleStatusChange = async (
    requestId: Id<"featureRequests">,
    status: "open" | "planned" | "shipped" | "declined",
  ) => {
    try { await updateStatusMut({ requestId, status }); }
    catch (err: any) { toast.error(err.message); }
  };

  if (requests === undefined) {
    return (
      <div className="space-y-3 pt-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          variant="default"
          onClick={() => setShowForm((v) => !v)}
          className="gap-1.5 rounded-full text-xs h-7 px-3"
        >
          <Plus className="w-3 h-3" />
          Request Feature
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Feature title (required)"
                required
                maxLength={120}
                className="text-sm"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details… (optional)"
                rows={2}
                className="text-sm resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Request list */}
      {requests.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No feature requests yet — be the first to suggest one!
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open;
            const StatusIcon = cfg.icon;
            return (
              <Card key={req._id} className="flex gap-3 items-start p-3">
                {/* Vote */}
                <button
                  onClick={() => handleVote(req._id)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md flex-shrink-0 transition-all ${
                    req.hasVoted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/70 text-muted-foreground"
                  }`}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{req.votes}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{req.title}</p>
                  {req.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="secondary"
                      className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0 ${cfg.className}`}
                    >
                      <StatusIcon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      by {req.authorName ?? "someone"} ·{" "}
                      {formatDistanceToNow(req._creationTime)} ago
                    </span>
                  </div>
                </div>

                {/* Owner status selector */}
                {isOwner && (
                  <Select
                    value={req.status}
                    onValueChange={(val) =>
                      handleStatusChange(req._id, val as any)
                    }
                  >
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
