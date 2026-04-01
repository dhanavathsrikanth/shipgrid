"use client";

import React, { ReactNode, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid,
  List,
  PlusCircle,
  Search,
  ThumbsUp,
  ChevronDown,
  Menu,
  Sparkles,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConvexBox } from "./ConvexBox";
import { Footer } from "./Footer";
import {
  useUser,
  useClerk,
  SignInButton,
  SignUpButton,
  useAuth,
} from "@clerk/nextjs";
import { UserSyncer } from "./UserSyncer";
import { WeeklyLeaderboard } from "./WeeklyLeaderboard";
import { TopCategoriesOfWeek } from "./TopCategoriesOfWeek";
import { RecentVibers } from "./RecentVibers";
import { AuthRequiredDialog } from "./ui/AuthRequiredDialog";
import { formatDistanceToNow } from "date-fns";
import { Navbar5 } from "./ui/navbar-5";

interface LayoutContextType {
  viewMode: "list" | "grid" | "vibe";
  selectedTagId?: Id<"tags">;
  sortPeriod: SortPeriod;
  showMatchedOnly: boolean;
  setShowMatchedOnly: (val: boolean) => void;
}

type SortPeriod =
  | "today"
  | "week"
  | "month"
  | "year"
  | "all"
  | "votes_today"
  | "votes_week"
  | "votes_month"
  | "votes_year"
  | "votes_all";

const LayoutContext = createContext<LayoutContextType>({
  viewMode: "vibe",
  sortPeriod: "all",
  showMatchedOnly: false,
  setShowMatchedOnly: () => {},
});

export function useLayoutContext() {
  return useContext(LayoutContext);
}

export function Layout({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: clerkUser, isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const clerk = useClerk();
  const menuRef = React.useRef<HTMLDivElement>(null);

  const settings = useQuery(api.settings.get);
  const [viewMode, setViewMode] = React.useState<"grid" | "list" | "vibe" | undefined>(undefined);
  const [userChangedViewMode, setUserChangedViewMode] = React.useState(false);
  const [userChangedSortPeriod, setUserChangedSortPeriod] = React.useState(false);
  const [sortPeriod, setSortPeriod] = React.useState<SortPeriod | undefined>(undefined);
  const [selectedTagId, setSelectedTagId] = React.useState<Id<"tags"> | undefined>(undefined);
  const [showMatchedOnly, setShowMatchedOnly] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);

  const headerTags = useQuery(api.tags.listHeader);
  const convexUserDoc = useQuery(api.users.getMyUserDocument, isClerkLoaded && isSignedIn ? {} : "skip");
  const hasUnreadAlerts = useQuery(api.alerts.hasUnread, isClerkLoaded && isSignedIn ? {} : "skip");
  const recentAlerts = useQuery(api.alerts.listRecentForDropdown, isClerkLoaded && isSignedIn ? {} : "skip");
  const userInboxEnabled = useQuery(
    api.dm.getInboxEnabled,
    isClerkLoaded && isSignedIn && convexUserDoc?._id ? { userId: convexUserDoc._id } : "skip",
  );
  const hasUnreadMessages = useQuery(api.dm.hasUnreadMessages, isClerkLoaded && isSignedIn ? {} : "skip");

  React.useEffect(() => {
    if (settings) {
      if (!userChangedViewMode) {
        const isAdminPage = pathname.startsWith("/admin");
        const isSetUsernamePage = pathname === "/set-username";
        const isUserSettingsPage = pathname.toLowerCase().startsWith("/user-settings");
        let isProfilePage = false;
        if (isSignedIn && convexUserDoc?.username) {
          isProfilePage = pathname === `/${convexUserDoc.username}`;
        }
        let newViewMode: "grid" | "list" | "vibe" | undefined = undefined;
        if (isAdminPage) {
          newViewMode = settings.adminDashboardDefaultViewMode === "none" ? undefined : settings.adminDashboardDefaultViewMode || "list";
        } else if (isProfilePage) {
          newViewMode = settings.profilePageDefaultViewMode === "none" ? undefined : settings.profilePageDefaultViewMode || "list";
        } else if (isSetUsernamePage || isUserSettingsPage) {
          newViewMode = undefined;
        } else {
          if (settings.siteDefaultViewMode === "none") {
            newViewMode = undefined;
          } else if (settings.siteDefaultViewMode === "list" && settings.showListView) {
            newViewMode = "list";
          } else if (settings.siteDefaultViewMode === "grid" && settings.showGridView) {
            newViewMode = "grid";
          } else if (settings.siteDefaultViewMode === "vibe" && settings.showVibeView) {
            newViewMode = "vibe";
          } else {
            if (settings.showListView) newViewMode = "list";
            else if (settings.showGridView) newViewMode = "grid";
            else if (settings.showVibeView) newViewMode = "vibe";
            else newViewMode = undefined;
          }
        }
        if (viewMode !== newViewMode) setViewMode(newViewMode);
      }
      if (!userChangedSortPeriod) {
        const newSortPeriod = settings.defaultSortPeriod || "all";
        if (sortPeriod !== newSortPeriod) setSortPeriod(newSortPeriod);
      } else if (sortPeriod === undefined) {
        setSortPeriod("all");
      }
    } else {
      if (!userChangedViewMode && viewMode === undefined) setViewMode("vibe");
      if (!userChangedSortPeriod && sortPeriod === undefined) setSortPeriod("all");
    }
  }, [settings, userChangedViewMode, userChangedSortPeriod, pathname, isSignedIn, convexUserDoc, viewMode, sortPeriod]);

  React.useEffect(() => {
    const isAdminPage = pathname.startsWith("/admin");
    const isSetUsernamePage = pathname === "/set-username";
    let isProfilePage = false;
    if (isSignedIn && convexUserDoc?.username) {
      isProfilePage = pathname === `/${convexUserDoc.username}`;
    }
    if ((isAdminPage || isSetUsernamePage || isProfilePage) && userChangedViewMode) {
      setUserChangedViewMode(false);
    }
  }, [pathname, isSignedIn, convexUserDoc, userChangedViewMode]);

  const siteTitle = settings?.siteTitle || "Vibe Apps";

  const isStoryDetailPage = pathname.startsWith("/s/");
  const isJudgingPage = pathname.startsWith("/judging/");
  const isYCHackFormPage = pathname === "/ychack";
  const isDynamicSubmitFormPage = pathname.startsWith("/submit/");
  const isCustomFormPage = pathname.startsWith("/f/");
  const isPublicResultsPage = pathname.startsWith("/results/");
  const isAdminFormPage = pathname.startsWith("/admin/forms/");
  const showSidebar =
    settings &&
    !isStoryDetailPage && !isJudgingPage && !isYCHackFormPage &&
    !isDynamicSubmitFormPage && !isCustomFormPage && !isPublicResultsPage && !isAdminFormPage &&
    (viewMode === "vibe" || viewMode === "list") &&
    (settings.showListView || settings.showVibeView);

  const contextValue: LayoutContextType = {
    viewMode: viewMode || "vibe",
    selectedTagId,
    sortPeriod: sortPeriod || "all",
    showMatchedOnly,
    setShowMatchedOnly,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar5 
          siteTitle={siteTitle}
          isSignedIn={isSignedIn}
          isClerkLoaded={isClerkLoaded}
          clerkUser={clerkUser}
          hasUnreadAlerts={hasUnreadAlerts || false}
          recentAlerts={recentAlerts}
          userInboxEnabled={userInboxEnabled}
          hasUnreadMessages={hasUnreadMessages || false}
          viewMode={viewMode}
          setViewMode={setViewMode}
          setUserChangedViewMode={setUserChangedViewMode}
          sortPeriod={sortPeriod}
          setSortPeriod={setSortPeriod}
          setUserChangedSortPeriod={setUserChangedSortPeriod}
          selectedTagId={selectedTagId}
          setSelectedTagId={setSelectedTagId}
          headerTags={headerTags}
          convexUserDoc={convexUserDoc}
          settings={settings || undefined}
        />

        {/* Secondary Filter Bar */}
        {!isStoryDetailPage && !isJudgingPage && !isYCHackFormPage && !isDynamicSubmitFormPage && !isCustomFormPage && !isPublicResultsPage && !isAdminFormPage && (
          <div className="bg-background border-b py-2 sticky top-[65px] z-40">
            <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative inline-block text-left">
                  <select 
                    value={selectedTagId || ""} 
                    onChange={(e) => setSelectedTagId(e.target.value ? (e.target.value as Id<"tags">) : undefined)} 
                    className="appearance-none cursor-pointer pl-3 pr-8 py-1.5 bg-muted/50 border rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">All Categories</option>
                    {headerTags?.filter((tag) => !tag.isHidden && tag.name !== "resendhackathon" && tag.name !== "ychackathon").map((tag) => (
                      <option key={tag._id} value={tag._id}>{tag.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground"><ChevronDown size={14} /></div>
                </div>

                <div className="relative inline-block text-left">
                  <select 
                    value={sortPeriod} 
                    onChange={(e) => { setSortPeriod(e.target.value as SortPeriod); setUserChangedSortPeriod(true); }} 
                    className="appearance-none cursor-pointer pl-3 pr-8 py-1.5 bg-muted/50 border rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="all">Most Recent</option>
                    <option value="votes_today">Most Vibes (Today)</option>
                    <option value="votes_week">Most Vibes (Week)</option>
                    <option value="votes_month">Most Vibes (Month)</option>
                    <option value="votes_year">Most Vibes (Year)</option>
                    <option value="votes_all">Most Vibes (All Time)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground"><ChevronDown size={14} /></div>
                </div>
              </div>

              {headerTags && headerTags.filter((tag) => !tag.isHidden && tag.showInHeader).length > 0 && (
                <div className="hidden md:flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => { setSelectedTagId(undefined); setShowMatchedOnly(false); if (pathname !== "/") router.push("/"); }} 
                    className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all", (selectedTagId === undefined && !showMatchedOnly) ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80")}
                  >
                    All
                  </button>
                  {isSignedIn && settings?.enableIcpMatching !== false && (
                    <button 
                      onClick={() => { setShowMatchedOnly(true); setSelectedTagId(undefined); if (pathname !== "/") router.push("/"); }} 
                      className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1", showMatchedOnly ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground")}
                    >
                      <Sparkles size={12} className={showMatchedOnly ? "animate-pulse" : ""} /> Matched
                    </button>
                  )}
                  {headerTags.filter((tag) => !tag.isHidden && tag.showInHeader && tag.name !== "resendhackathon" && tag.name !== "ychackathon").slice(0, 8).map((tag) => (
                    <Link 
                      key={tag._id} 
                      href={`/tag/${tag.slug}`} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border hover:opacity-80 transition-all"
                      style={{ backgroundColor: tag.backgroundColor || "transparent", color: tag.textColor || "inherit", borderColor: tag.borderColor || "transparent" }}
                    >
                      {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <main className="flex-grow container mx-auto px-4 py-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className={showSidebar ? "lg:w-3/4" : "w-full"}>{children}</div>
            {showSidebar && (
              <aside className="lg:w-1/4 space-y-6">
                <WeeklyLeaderboard />
                <RecentVibers />
                <TopCategoriesOfWeek selectedTagId={selectedTagId} setSelectedTagId={setSelectedTagId} />
              </aside>
            )}
          </div>
        </main>
        <Footer />
      </div>
      <AuthRequiredDialog isOpen={showAuthDialog} onClose={() => setShowAuthDialog(false)} action="submit your app" title="Sign in to submit" description="You need to be signed in to submit apps to the community. Join to share your projects!" />
    </LayoutContext.Provider>
  );
}
