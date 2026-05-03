"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

// Map of URL segments to nice display labels.
// Falls back to title-cased segment if not found.
const SEGMENT_LABELS: Record<string, string> = {
  s: "Apps",
  tag: "Tags",
  browse: "Browse",
  leaderboard: "Leaderboard",
  profile: "Profile",
  settings: "Settings",
  inbox: "Inbox",
  alerts: "Alerts",
  bookmarks: "Bookmarks",
  judging: "Judging",
  admin: "Admin",
  submit: "Submit",
  about: "About",
  pricing: "Pricing",
  terms: "Terms",
  privacy: "Privacy",
  contact: "Contact",
  forms: "Forms",
  results: "Results",
  "sign-in": "Sign In",
  "sign-up": "Sign Up",
  "edit-profile": "Edit Profile",
  "set-username": "Set Username",
  "users-by-followers": "Top Followers",
  "users-by-following": "Most Following",
};

// Paths where breadcrumbs should be hidden entirely.
const HIDDEN_PATHS = new Set<string>([
  "/",
  "/sign-in",
  "/sign-up",
]);

// Path prefixes to hide breadcrumbs (e.g. admin uses its own nav)
const HIDDEN_PREFIXES = ["/admin"];

// Segments that don't have an index page and should not be clickable links
const NON_CLICKABLE_SEGMENTS = new Set<string>(["s"]);

function toLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // Decode + un-slugify
  const decoded = decodeURIComponent(segment);
  // If it's a long ID/slug, truncate gracefully
  if (decoded.length > 32) {
    return decoded.slice(0, 30) + "…";
  }
  return decoded
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AutoBreadcrumbs() {
  const pathname = usePathname() || "/";

  // Hide on configured paths
  if (HIDDEN_PATHS.has(pathname)) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  // Split path into segments
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // Build crumbs with cumulative paths
  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const isClickable = !NON_CLICKABLE_SEGMENTS.has(segment);
    return {
      label: toLabel(segment),
      href,
      isLast,
      isClickable,
    };
  });

  return (
    <div className="bg-background/50 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-2.5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-1.5 hover:text-foreground transition-colors",
                )}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </BreadcrumbItem>

            {crumbs.map((crumb) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="max-w-[200px] sm:max-w-[320px] truncate">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : crumb.isClickable ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors max-w-[150px] truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground max-w-[150px] truncate cursor-default">
                      {crumb.label}
                    </span>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
