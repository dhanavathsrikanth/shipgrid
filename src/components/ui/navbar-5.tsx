"use client";

import { MenuIcon, PlusCircle, Bell, Inbox, Search, LogOut, Settings, User, LayoutGrid, List, ThumbsUp, ChevronDown, Sparkles } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useClerk, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

interface Navbar5Props {
  siteTitle: string;
  isSignedIn: boolean;
  isClerkLoaded: boolean;
  clerkUser: any;
  hasUnreadAlerts: boolean;
  recentAlerts: any[] | undefined;
  userInboxEnabled: boolean | undefined;
  hasUnreadMessages: boolean;
  viewMode: "grid" | "list" | "vibe" | undefined;
  setViewMode: (mode: "grid" | "list" | "vibe") => void;
  setUserChangedViewMode: (val: boolean) => void;
  sortPeriod: string | undefined;
  setSortPeriod: (period: any) => void;
  setUserChangedSortPeriod: (val: boolean) => void;
  selectedTagId: Id<"tags"> | undefined;
  setSelectedTagId: (id: Id<"tags"> | undefined) => void;
  headerTags: any[] | undefined;
  convexUserDoc: any;
  settings: any | undefined;
}

export const Navbar5 = ({
  siteTitle,
  isSignedIn,
  isClerkLoaded,
  clerkUser,
  hasUnreadAlerts,
  recentAlerts,
  userInboxEnabled,
  hasUnreadMessages,
  viewMode,
  setViewMode,
  setUserChangedViewMode,
  sortPeriod,
  setSortPeriod,
  setUserChangedSortPeriod,
  selectedTagId,
  setSelectedTagId,
  headerTags,
  convexUserDoc,
  settings
}: Navbar5Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const clerk = useClerk();
  const { isAuthenticated } = useConvexAuth();
  const isAdminUser = useQuery(api.users.checkIsUserAdmin, isAuthenticated ? {} : "skip");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const alertsDropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchExpanded(false);
    }
  };

  useEffect(() => {
    if (!showProfileDropdown) return;
    function handleClick(e: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfileDropdown]);

  useEffect(() => {
    if (!showAlertsDropdown) return;
    function handleClick(e: MouseEvent) {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(e.target as Node)) {
        setShowAlertsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAlertsDropdown]);

  let profileUrl = "/sign-in";
  if (isClerkLoaded && isSignedIn) {
    if (convexUserDoc === undefined) profileUrl = "#";
    else if (convexUserDoc && convexUserDoc.username) profileUrl = `/${convexUserDoc.username}`;
    else profileUrl = "/set-username";
  }

  const primaryTags = headerTags?.filter(tag => !tag.isHidden && tag.showInHeader && tag.name !== "resendhackathon" && tag.name !== "ychackathon") || [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center justify-between gap-4">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight title-font">
              {siteTitle}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[600px] grid-cols-3 p-4 gap-2">
                       <NavigationMenuLink
                          onClick={() => { setSelectedTagId(undefined); if (pathname !== "/") router.push("/"); }}
                          className="flex flex-col gap-1 rounded-md p-3 transition-colors hover:bg-muted/70 cursor-pointer"
                        >
                          <p className="font-semibold text-foreground">All Categories</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">Show apps from all vibes and communities.</p>
                        </NavigationMenuLink>
                      {primaryTags.map((tag) => (
                        <Link
                          key={tag._id}
                          href={`/tag/${tag.slug}`}
                          className="flex flex-col gap-1 rounded-md p-3 transition-colors hover:bg-muted/70"
                        >
                          <div className="flex items-center gap-2">
                            {tag.emoji ? <span>{tag.emoji}</span> : null}
                            <p className="font-semibold text-foreground">{tag.name}</p>
                          </div>
                          {tag.description && <p className="text-xs text-muted-foreground line-clamp-2">{tag.description}</p>}
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/browse">
                      Browse
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/leaderboard">
                      Leaderboard
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {settings?.showHackathon && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link href="/hackathon">
                        Hackathon
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
                {settings?.showJudging && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link href="/judging">
                        Judging
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* View Toggles & Search */}
            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
                <button 
                  onClick={() => { setViewMode("list"); setUserChangedViewMode(true); if (pathname !== "/") router.push("/"); }}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <List size={18} />
                </button>
                <button 
                  onClick={() => { setViewMode("grid"); setUserChangedViewMode(true); if (pathname !== "/") router.push("/"); }}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => { setViewMode("vibe"); setUserChangedViewMode(true); if (pathname !== "/") router.push("/"); }}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === "vibe" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <ThumbsUp size={18} />
                </button>
              </div>

              <form onSubmit={handleSearch} className="relative hidden xl:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search apps..."
                  className="w-[200px] lg:w-[300px] pl-9 bg-muted/50 border-none focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          </div>

          {/* Right Section: Auth & Actions */}
          <div className="flex items-center gap-3">
            <Button 
               variant="default"
               size="sm"
               className="hidden sm:flex gap-2 rounded-full"
               onClick={() => { if (isSignedIn) { router.push("/submit"); } else { router.push("/sign-in"); } }}
            >
              <PlusCircle size={16} />
              Submit
            </Button>

            {!isSignedIn && isClerkLoaded ? (
              <div className="hidden lg:flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Get Started</Button>
                </SignUpButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Notifications Bell */}
                <div className="relative" ref={alertsDropdownRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full"
                    onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                  >
                    <Bell size={20} className="text-muted-foreground" />
                    {hasUnreadAlerts && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                    )}
                  </Button>
                  {showAlertsDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-popover rounded-xl shadow-2xl border border-border py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                       <div className="px-4 py-2 border-b border-border">
                        <h3 className="text-sm font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {recentAlerts && recentAlerts.length > 0 ? (
                          recentAlerts.map((alert: any) => (
                            <DropdownNotificationItem key={alert._id} alert={alert} onClose={() => setShowAlertsDropdown(false)} />
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
                        )}
                      </div>
                      <Link href="/notifications" className="block w-full px-4 py-2 text-center text-xs font-medium text-primary hover:bg-muted" onClick={() => setShowAlertsDropdown(false)}>
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>

                {/* Inbox */}
                {userInboxEnabled !== false && (
                  <Link href="/inbox">
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <Inbox size={20} className="text-muted-foreground" />
                      {hasUnreadMessages && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                      )}
                    </Button>
                  </Link>
                )}

                {/* User Profile */}
                <div className="relative" ref={profileDropdownRef}>
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-muted border overflow-hidden hover:opacity-90 transition-all shadow-sm"
                  >
                    {clerkUser?.imageUrl ? (
                      <img src={clerkUser.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-muted-foreground" />
                    )}
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-popover rounded-xl shadow-2xl border border-border py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 border-b mb-1">
                        <p className="text-sm font-semibold truncate">{clerkUser?.fullName || clerkUser?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
                      </div>
                      <Link href={profileUrl} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setShowProfileDropdown(false)}>
                        <User size={16} /> My Profile
                      </Link>
                      {isAdminUser && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setShowProfileDropdown(false)}>
                          <LayoutGrid size={16} /> Admin Panel
                        </Link>
                      )}
                      <button onClick={() => { clerk.openUserProfile(); setShowProfileDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted text-left">
                        <Settings size={16} /> Settings
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button onClick={() => { clerk.signOut({ redirectUrl: "/" }); setShowProfileDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 text-left">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <MenuIcon size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col p-0">
                <SheetHeader className="p-6 border-b text-left">
                  <SheetTitle className="title-font text-xl">{siteTitle}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search apps..."
                        className="pl-9 bg-muted/50 border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </form>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="categories" className="border-none">
                        <AccordionTrigger className="hover:no-underline font-semibold">Categories</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 gap-1">
                            <button
                              onClick={() => { setSelectedTagId(undefined); router.push("/"); }}
                              className="px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
                            >
                              All Categories
                            </button>
                            {primaryTags.map((tag) => (
                              <Link
                                key={tag._id}
                                href={`/tag/${tag.slug}`}
                                className="px-3 py-2 text-sm rounded-md hover:bg-muted"
                              >
                                {tag.emoji} {tag.name}
                              </Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex flex-col gap-4 py-2">
                       <Link href="/browse" className="font-semibold text-sm px-1 text-primary flex items-center gap-2">
                         <Sparkles size={16} /> Browse
                       </Link>
                       <Link href="/leaderboard" className="font-semibold text-sm px-1">Leaderboard</Link>
                       {settings?.showHackathon && <Link href="/hackathon" className="font-semibold text-sm px-1">Hackathon</Link>}
                       {settings?.showJudging && <Link href="/judging" className="font-semibold text-sm px-1">Judging</Link>}
                       <Link href="/notifications" className="font-semibold text-sm px-1">Notifications</Link>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t bg-muted/50 space-y-4">
                  {!isSignedIn ? (
                    <div className="flex flex-col gap-2">
                      <SignInButton mode="modal">
                        <Button variant="outline" className="w-full">Sign in</Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button className="w-full">Get Started</Button>
                      </SignUpButton>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full text-destructive" onClick={() => clerk.signOut({ redirectUrl: "/" })}>
                      Sign Out
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

// Helper component for notifications
function DropdownNotificationItem({ alert, onClose }: { alert: any; onClose: () => void }) {
  const actorUser = useQuery(api.users.getUserById, alert.actorUserId ? { userId: alert.actorUserId } : "skip");

  const getNotificationText = () => {
    switch (alert.type) {
      case "vote": return "vibed your app";
      case "comment": return "commented on your app";
      case "rating": return `rated your app ${alert.ratingValue} stars`;
      case "follow": return "started following you";
      case "judged": return "Your app has been judged";
      case "bookmark": return "bookmarked your app";
      case "report": return "reported a submission";
      default: return "interacted with your content";
    }
  };

  return (
    <div className={cn("px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted transition-colors", !alert.isRead && "bg-primary/5")}>
      <div className="flex items-start gap-3">
        {actorUser && (
          <div className="flex-shrink-0">
            {actorUser.imageUrl ? (
              <img src={actorUser.imageUrl} alt={actorUser.name} className="w-8 h-8 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">{actorUser.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground leading-relaxed">
            {alert.type === "judged" ? (
              <span className="text-foreground">{getNotificationText()}</span>
            ) : actorUser ? (
              <>
                {actorUser.username ? (
                  <Link href={`/${actorUser.username}`} className="font-semibold text-foreground hover:underline" onClick={onClose}>{actorUser.name}</Link>
                ) : (
                  <span className="font-semibold text-foreground">{actorUser.name}</span>
                )}{" "}
                {getNotificationText()}
              </>
            ) : (
              <span>Someone {getNotificationText()}</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1" suppressHydrationWarning>
            {formatDistanceToNow(alert._creationTime, { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
