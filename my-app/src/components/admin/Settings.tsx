"use client";

import React, { useState, useEffect } from "react";
import { Save, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { SiteSettings } from "../../types";
import { ConvexBoxSettingsForm } from "./ConvexBoxSettingsForm";

// Define SortPeriod locally for type casting, mirroring Layout.tsx
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

// Define ViewMode locally for type casting
type ViewMode = "list" | "grid" | "vibe";

// Define DEFAULT_SETTINGS at the top of the file, for example:
const DEFAULT_SETTINGS_FRONTEND = {
  itemsPerPage: 20,
  siteTitle: "Vibe Apps",
  defaultSortPeriod: "all" as SortPeriod,
  showListView: true,
  showGridView: true,
  showVibeView: true,
  siteDefaultViewMode: "vibe" as ViewMode | "none",
  profilePageDefaultViewMode: "list" as ViewMode | "none",
  adminDashboardDefaultViewMode: "list" as ViewMode | "none",
  showSubmissionLimit: true,
  submissionLimitCount: 10,
  showHackathon: true,
  showJudging: true,
  enableIcpMatching: false,
  showFounderAnalytics: false,
};

export function Settings() {
  const { isLoading: authIsLoading, isAuthenticated } = useConvexAuth();

  const currentSettings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);
  const initializeSettings = useMutation(api.settings.initialize); // For first-time setup

  const [localSettings, setLocalSettings] = useState<Partial<SiteSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      // Initialize local state with fetched settings, excluding system fields
      const { _id, _creationTime, ...editableSettings } = currentSettings;
      // Ensure all new fields are initialized in localSettings, even if not in currentSettings initially
      setLocalSettings({
        ...DEFAULT_SETTINGS_FRONTEND,
        ...editableSettings,
      });
    }
  }, [currentSettings]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      processedValue = value === "" ? 0 : parseInt(value, 10); // Handle empty input for numbers
    } else if (name === "defaultSortPeriod") {
      processedValue = value as SortPeriod; // Ensure it's treated as SortPeriod type
    } else if (name === "siteDefaultViewMode") {
      processedValue = value as ViewMode | "none";
    } else if (
      name === "profilePageDefaultViewMode" ||
      name === "adminDashboardDefaultViewMode"
    ) {
      processedValue = value as ViewMode | "none";
    }

    setLocalSettings((prev: any) => ({ ...prev, [name]: processedValue }));
    setShowSuccess(false); // Hide success message on new change
    setError(null);
  };

  const handleSave = async () => {
    if (!currentSettings) {
      setError("Cannot save, current settings not loaded.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setShowSuccess(false);
    try {
      // Only send fields that exist in the mutation args
      const updates: Partial<SiteSettings> = {};
      if (localSettings.itemsPerPage !== undefined)
        updates.itemsPerPage = localSettings.itemsPerPage;
      if (localSettings.siteTitle !== undefined)
        updates.siteTitle = localSettings.siteTitle;
      if (localSettings.defaultSortPeriod !== undefined) {
        updates.defaultSortPeriod = localSettings.defaultSortPeriod;
      }
      // Add new settings to updates
      if (localSettings.showListView !== undefined)
        updates.showListView = localSettings.showListView;
      if (localSettings.showGridView !== undefined)
        updates.showGridView = localSettings.showGridView;
      if (localSettings.showVibeView !== undefined)
        updates.showVibeView = localSettings.showVibeView;
      if (localSettings.siteDefaultViewMode !== undefined) {
        updates.siteDefaultViewMode = localSettings.siteDefaultViewMode;
      }
      if (localSettings.profilePageDefaultViewMode !== undefined) {
        updates.profilePageDefaultViewMode =
          localSettings.profilePageDefaultViewMode;
      }
      if (localSettings.adminDashboardDefaultViewMode !== undefined) {
        updates.adminDashboardDefaultViewMode =
          localSettings.adminDashboardDefaultViewMode;
      }
      // Add new submission limit settings to updates
      if (localSettings.showSubmissionLimit !== undefined)
        updates.showSubmissionLimit = localSettings.showSubmissionLimit;
      if (localSettings.submissionLimitCount !== undefined)
        updates.submissionLimitCount = localSettings.submissionLimitCount;
      // Add ICP and visibility settings to updates
      if (localSettings.showHackathon !== undefined)
        updates.showHackathon = localSettings.showHackathon;
      if (localSettings.showJudging !== undefined)
        updates.showJudging = localSettings.showJudging;
      if (localSettings.enableIcpMatching !== undefined)
        updates.enableIcpMatching = localSettings.enableIcpMatching;
      if (localSettings.showFounderAnalytics !== undefined)
        updates.showFounderAnalytics = localSettings.showFounderAnalytics;

      await updateSettings(updates);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitialize = async () => {
    setError(null);
    try {
      await initializeSettings({});
      // Settings will refetch via useQuery
    } catch (err) {
      console.error("Failed to initialize settings:", err);
      setError(err instanceof Error ? err.message : "Initialization failed.");
    }
  };

  const hasChanges =
    JSON.stringify(localSettings) !==
    JSON.stringify(
      currentSettings
        ? (({ _id, _creationTime, ...rest }) => rest)(currentSettings)
        : {},
    );

  // Check if settings need initialization (i.e., _id is missing)
  const needsInitialization =
    currentSettings !== undefined && !("_id" in currentSettings);

  // Handle auth loading state globally for the component if desired,
  // though individual query loading is handled below.
  if (authIsLoading) {
    return (
      <div className="space-y-8 text-center">Loading authentication...</div>
    );
  }

  // If settings data itself is loading (and auth is done)
  if (!authIsLoading && currentSettings === undefined) {
    return <div className="text-center">Loading settings...</div>;
  }

  // If settings need initialization (and auth is done)
  if (!authIsLoading && needsInitialization) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-sm text-amber-900 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-medium">Site Settings Not Initialized</h3>
        </div>
        <p>Initial site settings need to be created in the database.</p>
        <button
          onClick={handleInitialize}
          className="px-3 py-1 bg-amber-200 text-amber-900 rounded hover:bg-amber-300 transition-colors text-xs font-medium"
        >
          Initialize Default Settings
        </button>
        {error && <p className="text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  if (!authIsLoading && currentSettings === undefined) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-medium text-foreground">Site Settings</h2>
          {(hasChanges || showSuccess) && (
            <div className="flex items-center gap-4">
              {showSuccess && (
                <span className="text-sm text-primary font-medium animate-pulse">Saved!</span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-destructive border border-destructive/20 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 max-w-md">
          {/* Site Title Setting */}
          <div>
            <label
              htmlFor="siteTitle"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Site Title
            </label>
            <input
              id="siteTitle"
              name="siteTitle"
              type="text"
              value={localSettings.siteTitle ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              disabled={isSaving}
            />
          </div>

          {/* Items Per Page Setting */}
          <div>
            <label
              htmlFor="itemsPerPage"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Submissions Per Page (Load More quantity)
            </label>
            <input
              id="itemsPerPage"
              name="itemsPerPage"
              type="number"
              min="5" // Example min value
              max="100" // Example max value
              value={
                localSettings.itemsPerPage ??
                DEFAULT_SETTINGS_FRONTEND.itemsPerPage
              }
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              disabled={isSaving}
            />
          </div>

          {/* Default Sort Period Setting */}
          <div>
            <label
              htmlFor="defaultSortPeriod"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Default Homepage Sort
            </label>
            <select
              id="defaultSortPeriod"
              name="defaultSortPeriod"
              value={localSettings.defaultSortPeriod || "all"} // Default to 'all' if not set
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              disabled={isSaving}
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
          </div>

          {/* --- New View Mode Settings --- */}
          <div className="pt-6 mt-6 border-t border-border">
            <h3 className="text-lg font-medium text-foreground mb-4">
              View Mode Configuration
            </h3>

            {/* View Mode Visibility */}
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-muted-foreground">
                Show View Mode Icons:
              </p>
              {["showListView", "showGridView", "showVibeView"].map((key) => {
                const typedKey = key as keyof Pick<
                  SiteSettings,
                  "showListView" | "showGridView" | "showVibeView"
                >;
                return (
                  <label key={typedKey} className="flex items-center gap-2">
                    <input
                      name={typedKey}
                      type="checkbox"
                      checked={localSettings[typedKey] ?? true} // Default to true if undefined
                      onChange={handleChange}
                      className="rounded border-border text-primary focus:ring-primary"
                      disabled={isSaving}
                    />
                    <span className="text-sm text-foreground">
                      {typedKey.replace("show", "").replace("View", " View")}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Site Default View Mode Setting */}
            <div>
              <label
                htmlFor="siteDefaultViewMode"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Site Default View Mode (Homepage, etc.)
              </label>
              <select
                id="siteDefaultViewMode"
                name="siteDefaultViewMode"
                value={localSettings.siteDefaultViewMode || "none"}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                disabled={isSaving}
              >
                <option value="none">
                  None (User selection or first available)
                </option>
                {localSettings.showListView && (
                  <option value="list">List View</option>
                )}
                {localSettings.showGridView && (
                  <option value="grid">Grid View</option>
                )}
                {localSettings.showVibeView && (
                  <option value="vibe">Vibe View</option>
                )}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                If a view mode is hidden, it cannot be set as default. 'None'
                means no view mode is pre-selected.
              </p>
            </div>

            {/* Profile Page Default View Mode */}
            <div className="mt-4">
              <label
                htmlFor="profilePageDefaultViewMode"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Profile Page Default View Mode
              </label>
              <select
                id="profilePageDefaultViewMode"
                name="profilePageDefaultViewMode"
                value={localSettings.profilePageDefaultViewMode || "list"}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                disabled={isSaving}
              >
                {/* Profile page can always choose, not tied to show...View settings for header icons */}
                <option value="none">
                  None (User selection or first available)
                </option>
                <option value="list">List View</option>
                <option value="grid">Grid View</option>
                <option value="vibe">Vibe View</option>
              </select>
            </div>

            {/* Admin Dashboard Default View Mode */}
            <div className="mt-4">
              <label
                htmlFor="adminDashboardDefaultViewMode"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Admin Dashboard Default View Mode
              </label>
              <select
                id="adminDashboardDefaultViewMode"
                name="adminDashboardDefaultViewMode"
                value={localSettings.adminDashboardDefaultViewMode || "list"}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                disabled={isSaving}
              >
                {/* Admin page can always choose */}
                <option value="none">
                  None (User selection or first available)
                </option>
                <option value="list">List View</option>
                <option value="grid">Grid View</option>
                <option value="vibe">Vibe View</option>
              </select>
            </div>
          </div>

          {/* --- Submission Limit Settings --- */}
          <div className="pt-6 mt-6 border-t border-border">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Submission Limit Settings
            </h3>

            {/* Show Submission Limit */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  name="showSubmissionLimit"
                  type="checkbox"
                  checked={localSettings.showSubmissionLimit ?? true}
                  onChange={handleChange}
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={isSaving}
                />
                <span className="text-sm font-medium text-foreground">
                  Show submission limit message on forms
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                When enabled, displays the daily submission limit message on
                story submission forms
              </p>
            </div>

            {/* Submission Limit Count */}
            {localSettings.showSubmissionLimit && (
              <div>
                <label
                  htmlFor="submissionLimitCount"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Daily Submission Limit
                </label>
                <input
                  id="submissionLimitCount"
                  name="submissionLimitCount"
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.submissionLimitCount ?? 10}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all max-w-[200px]"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of projects users can submit per day
                </p>
              </div>
            )}
          </div>

          {/* --- ICP & Visibility Settings --- */}
          <div className="pt-6 mt-6 border-t border-border">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Platform Features & Visibility
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Hackathon Section</h4>
                  <p className="text-xs text-muted-foreground">Show Hackathon link in navigation</p>
                </div>
                <input
                  name="showHackathon"
                  type="checkbox"
                  checked={localSettings.showHackathon ?? true}
                  onChange={handleChange}
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Judging Section</h4>
                  <p className="text-xs text-muted-foreground">Show Judging link in navigation</p>
                </div>
                <input
                  name="showJudging"
                  type="checkbox"
                  checked={localSettings.showJudging ?? true}
                  onChange={handleChange}
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">ICP Matching Engine</h4>
                  <p className="text-xs text-muted-foreground">Enable "Matched for You" AI feed</p>
                </div>
                <input
                  name="enableIcpMatching"
                  type="checkbox"
                  checked={localSettings.enableIcpMatching ?? false}
                  onChange={handleChange}
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Founder Analytics</h4>
                  <p className="text-xs text-muted-foreground">Show ICP breakdown to project owners</p>
                </div>
                <input
                  name="showFounderAnalytics"
                  type="checkbox"
                  checked={localSettings.showFounderAnalytics ?? false}
                  onChange={handleChange}
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConvexBoxSettingsForm />
    </div>
  );
}

