"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2, TrendingUp, MousePointer2, Target } from "lucide-react";

interface StoryAnalyticsProps {
  storyId: Id<"stories">;
}

export function StoryAnalyticsDashboard({ storyId }: StoryAnalyticsProps) {
  // @ts-ignore
  const stats = useQuery(api.analytics.getStoryStats, { storyId, days: 30 });
  // @ts-ignore
  const summary = useQuery(api.analytics.getStorySummary, { storyId });

  if (stats === undefined || summary === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Fetching your analytics...</p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-muted p-4 rounded-full">
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="max-w-xs">
          <h3 className="text-lg font-medium">No data yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Analytics will appear here once your app starts receiving impressions and clicks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Impressions</span>
          </div>
          <div className="text-2xl font-bold" suppressHydrationWarning>{summary.impressions.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">People who saw your app</div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <MousePointer2 className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">External Clicks</span>
          </div>
          <div className="text-2xl font-bold" suppressHydrationWarning>{summary.clicks.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Visitors sent to your site</div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Conversion Intent</span>
          </div>
          <div className="text-2xl font-bold" suppressHydrationWarning>{summary.conversions.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Bookmarked or upvoted</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium mb-6">Performance Trajectory</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stats}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(str) => format(parseISO(str), "MMM d")}
                minTickGap={30}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px"
                }}
                labelFormatter={(str) => format(parseISO(str as string), "MMMM d, yyyy")}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area
                type="monotone"
                dataKey="impressions"
                name="Impressions"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorImp)"
              />
              <Area
                type="monotone"
                dataKey="clicks"
                name="Clicks"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClick)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
