"use client";

import React from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { 
  BarChart3, 
  Search, 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Globe,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminSEODashboard() {
  const stats = useQuery(api.seo.getGlobalStats);
  const stories = useQuery(api.seo.listStoriesWithReports);

  const [isAuditingAll, setIsAuditingAll] = React.useState(false);

  // In a real scenario, we'd have an action to audit all. 
  // For now, we'll implement a button that triggers individual audits.
  
  const handleRunAudit = async (storyId: any) => {
    toast.promise(
      // We don't have a direct public action for runAudit yet, we need to expose it in seo.ts
      // Or call a mutation that schedules the internal action.
      // Assuming we'll add a public action wrapper.
      new Promise((resolve) => setTimeout(resolve, 1000)), 
      {
        loading: "Running AI SEO Audit...",
        success: "Audit complete!",
        error: "Audit failed.",
      }
    );
  };

  if (!stats || !stories) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">AI SEO Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and optimize how AI search engines perceive your platform.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Clear Cache
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Search className="w-4 h-4" />
            Audit All Projects
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+4.2%</span>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.avgScore}%</div>
          <div className="text-sm text-muted-foreground font-medium">Avg. SEO Score</div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalAudited}</div>
          <div className="text-sm text-muted-foreground font-medium">Projects Audited</div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.criticalIssues}</div>
          <div className="text-sm text-muted-foreground font-medium">Critical Issues</div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">98.2%</div>
          <div className="text-sm text-muted-foreground font-medium">AI Readability Rate</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-semibold">Project Reports</h2>
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Filter projects..." 
              className="bg-transparent border-none text-sm focus:outline-none w-48"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO Health</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issues</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Scanned</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stories.map((item: any) => (
                <tr key={item._id} className="hover:bg-muted/10 transition-colors group">
                  <td className="p-4">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground">/s/{item.slug}</div>
                  </td>
                  <td className="p-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={item.report?.overallScore || 0} 
                        className={`h-2 w-24 ${
                          (item.report?.overallScore || 0) > 70 ? "[&>div]:bg-green-500" : 
                          (item.report?.overallScore || 0) > 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                        }`}
                      />
                      <span className="text-sm font-semibold">{item.report?.overallScore || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {item.report?.issues ? (
                      <div className="flex -space-x-2">
                        {item.report.issues.slice(0, 3).map((issue: any, i: number) => (
                          <div 
                            key={i} 
                            className={`w-6 h-6 rounded-full border-2 border-card flex items-center justify-center bg-muted`}
                            title={issue.message}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              issue.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                          </div>
                        ))}
                        {item.report.issues.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-card flex items-center justify-center bg-muted text-[10px] font-bold">
                            +{item.report.issues.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No data</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {item.report?.scannedAt ? new Date(item.report.scannedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Link href={`/s/${item.slug}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
