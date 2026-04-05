"use client";

import React, { useMemo } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Doc, Id } from "../../../convex/_generated/dataModel";

// Helper component for displaying each statistic
const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number | string | undefined;
}) => (
  <div className="bg-card border border-border rounded-lg p-4 min-h-[100px] shadow-sm">
    <h3 className="text-sm font-medium text-muted-foreground truncate">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-foreground">
      {value === undefined ? "Loading..." : value}
    </p>
  </div>
);

// Define types for the user objects returned by the queries
type UserWithFollowerCount = Doc<"users"> & {
  username: string; // Ensure username is always a string, defaulting to "N/A" if needed
  followerCount: number;
};

type UserWithFollowingCount = Doc<"users"> & {
  username: string; // Ensure username is always a string, defaulting to "N/A" if needed
  followingCount: number;
};

export function NumbersView() {
  const { isLoading: authIsLoading, isAuthenticated } = useConvexAuth();

  const skip = authIsLoading || !isAuthenticated;

  const overview = useQuery(
    api.adminQueries.getAdminOverview,
    skip ? "skip" : {},
  );

  // Growth stats are still needed for the growth chart
  const userGrowthData = useQuery(
    api.adminQueries.getUserGrowthData,
    skip ? "skip" : {},
  );

  // Add new queries for follow stats
  const topFollowers = useQuery(
    api.adminFollowsQueries.getTopUsersByFollowers,
    skip ? "skip" : { limit: 100 },
  );
  const topFollowing = useQuery(
    api.adminFollowsQueries.getTopUsersByFollowing,
    skip ? "skip" : { limit: 100 },
  );

  // Format data for display - show last 30 days or all data if less
  const chartData = useMemo(() => {
    if (!userGrowthData || userGrowthData.length === 0) return [];
    
    // Take last 30 data points or all if less than 30
    const dataToShow = userGrowthData.slice(-30);
    
    return dataToShow.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
    }));
  }, [userGrowthData]);

  // Calculate max value for scaling
  const maxUsers = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.cumulative));
  }, [chartData]);

  if (authIsLoading) {
    return (
      <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Key Metrics
      </h2>
      <div className="text-center py-10 text-muted-foreground">Loading authentication...</div>
      </div>
    );
  }

  const s = overview?.stats;
  const breakdown = overview?.stageBreakdown;

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">Platform Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatCard title="Total Submissions" value={s?.totalStories} />
        <StatCard title="Total Users" value={s?.totalUsers} />
        <StatCard title="Total Votes" value={s?.totalVotes} />
        <StatCard title="Total Comments" value={s?.totalComments} />
        <StatCard title="Pending Reports" value={s?.pendingReports} />
        <StatCard title="Total Product Follows" value={s?.totalProductFollows} />
      </div>

      {/* Product Lifecycle Breakdown */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-6">Product Lifecycle Stages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <div className="bg-card border border-border rounded-lg p-6 shadow-sm border-l-4 border-l-orange-500">
              <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-1">Building</h3>
              <p className="text-3xl font-bold">{breakdown?.building ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Private builds in progress</p>
           </div>
           <div className="bg-card border border-border rounded-lg p-6 shadow-sm border-l-4 border-l-blue-500">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">Beta</h3>
              <p className="text-3xl font-bold">{breakdown?.beta ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Open for testing & feedback</p>
           </div>
           <div className="bg-card border border-border rounded-lg p-6 shadow-sm border-l-4 border-l-green-500">
              <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Live</h3>
              <p className="text-3xl font-bold">{breakdown?.live ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Publicly launched products</p>
           </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          User Growth Over Time
        </h2>
        {chartData.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground italic">
            Loading growth data...
          </div>
        )}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="relative h-64 overflow-hidden">
              {/* Bars */}
              <div className="flex items-end justify-between h-full gap-1">
                {chartData.map((item, index) => {
                  const height = maxUsers > 0 ? (item.cumulative / maxUsers) * 100 : 0;
                  
                  return (
                    <div
                      key={item.date}
                      className="flex-1 flex flex-col items-center group relative"
                    >
                      {/* Bar */}
                      <div
                        className="w-full bg-primary hover:bg-primary/80 transition-colors rounded-t relative z-0"
                        style={{ height: `${height}%` }}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-foreground text-background text-xs rounded py-1 px-2 whitespace-nowrap z-20 shadow-lg">
                        <div className="font-semibold">{item.cumulative} users</div>
                        <div className="text-muted-foreground/80">{item.formattedDate}</div>
                        <div className="text-primary/90">+{item.count} new</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Growth Line */}
              <svg 
                className="absolute inset-0 pointer-events-none z-10" 
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%' }}
              >
                <polyline
                  points={chartData.map((item, index) => {
                    const x = ((index + 0.5) / chartData.length) * 100;
                    const y = 100 - (maxUsers > 0 ? (item.cumulative / maxUsers) * 100 : 0);
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            {/* X-axis labels - show every few labels to avoid crowding */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{chartData[0]?.formattedDate}</span>
              {chartData.length > 2 && (
                <span>{chartData[Math.floor(chartData.length / 2)]?.formattedDate}</span>
              )}
              <span>{chartData[chartData.length - 1]?.formattedDate}</span>
            </div>
            
            {/* Y-axis label and stats */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Users</span>
                <span className="text-2xl font-semibold text-foreground">
                  {chartData[chartData.length - 1]?.cumulative || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section for Top 100 Most Followed Users */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Top 100 Most Followed Users
        </h2>
        {topFollowers === undefined && (
          <p className="text-muted-foreground">Loading top followers...</p>
        )}
        {topFollowers && topFollowers.length === 0 && (
          <p className="text-muted-foreground italic">No follower data available.</p>
        )}
        {topFollowers && topFollowers.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <ul className="divide-y divide-border">
              {topFollowers.map(
                (user: UserWithFollowerCount | null, index: number) =>
                  user ? (
                    <li
                      key={user._id}
                      className="py-3 flex justify-between items-center"
                    >
                      <span className="text-sm text-foreground">
                        {index + 1}.{" "}
                        <Link
                          href={`/${user.username}`}
                          className="font-medium hover:text-primary transition-colors hover:underline"
                        >
                          {user.name || user.username || "Unnamed User"}
                        </Link>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {user.followerCount} followers
                      </span>
                    </li>
                  ) : null,
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Section for Top 100 Users Following Others Most */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Top 100 Users Following Others Most
        </h2>
        {topFollowing === undefined && (
          <p className="text-muted-foreground">Loading top following...</p>
        )}
        {topFollowing && topFollowing.length === 0 && (
          <p className="text-muted-foreground italic">No following data available.</p>
        )}
        {topFollowing && topFollowing.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <ul className="divide-y divide-border">
              {topFollowing.map(
                (user: UserWithFollowingCount | null, index: number) =>
                  user ? (
                    <li
                      key={user._id}
                      className="py-3 flex justify-between items-center"
                    >
                      <span className="text-sm text-foreground">
                        {index + 1}.{" "}
                        <Link
                          href={`/${user.username}`}
                          className="font-medium hover:text-primary transition-colors hover:underline"
                        >
                          {user.name || user.username || "Unnamed User"}
                        </Link>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        following {user.followingCount}
                      </span>
                    </li>
                  ) : null,
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}


