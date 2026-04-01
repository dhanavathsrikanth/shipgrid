"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NotFoundPage } from "../../views/NotFoundPage";
import { TagManagement } from "./TagManagement";
import { ContentModeration } from "./ContentModeration";
import { Settings } from "./Settings";
import { Forms } from "./Forms";
import { ReportManagement } from "./ReportManagement";
import { NumbersView } from "./NumbersView";
import { UserModeration } from "./UserModeration";
import { FormFieldManagement } from "./FormFieldManagement";
import { Judging } from "./Judging";
import { EmailManagement } from "./EmailManagement";
import { UserReportManagement } from "./UserReportManagement";
// FormResults is typically viewed via a specific form, not as a main tab.
// Consider removing it from the main tabs if it doesn't show an overview.

// Define the possible main tabs
type MainAdminTab =
  | "content"
  | "tags"
  | "submit-forms"
  | "judging"
  | "numbers"
  | "users"
  | "emails"
  | "settings";

// Define sub-tabs
type SubmitSubTab = "form-fields" | "forms";
type UserSubTab = "user-moderation" | "reports";

export function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMainTab = (searchParams.get("tab") as MainAdminTab) || "content";
  const [activeMainTab, setActiveMainTab] =
    useState<MainAdminTab>(initialMainTab);

  const initialSubmitSubTab =
    (searchParams.get("subtab") as SubmitSubTab) || "form-fields";
  const [activeSubmitSubTab, setActiveSubmitSubTab] =
    useState<SubmitSubTab>(initialSubmitSubTab);

  const initialUserSubTab =
    (searchParams.get("subtab") as UserSubTab) || "user-moderation";
  const [activeUserSubTab, setActiveUserSubTab] =
    useState<UserSubTab>(initialUserSubTab);

  const { isLoading: authIsLoading, isAuthenticated } = useConvexAuth();

  // Check if user is admin
  const isUserAdmin = useQuery(
    api.users.checkIsUserAdmin,
    isAuthenticated ? {} : "skip",
  );

  const handleMainTabChange = (value: string) => {
    setActiveMainTab(value as MainAdminTab);
    router.replace(`/admin?tab=${value}`);
  };

  const handleSubTabChange = (
    mainTab: "submit-forms" | "users",
    subTabValue: string,
  ) => {
    if (mainTab === "submit-forms") {
      const newSubTab = subTabValue as SubmitSubTab;
      setActiveSubmitSubTab(newSubTab);
      router.replace(`/admin?tab=mainTab, subtab: newSubTab`);
    } else if (mainTab === "users") {
      const newSubTab = subTabValue as UserSubTab;
      setActiveUserSubTab(newSubTab);
      router.replace(`/admin?tab=mainTab, subtab: newSubTab`);
    }
  };

  // Note: Auth and Admin check is now handled in the parent layout.tsx

    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-10 flex flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
          {activeMainTab.replace("-", " ")}
        </p>
      </div>

      <Tabs.Root
        value={activeMainTab}
        onValueChange={handleMainTabChange}
        className="space-y-6"
      >
        {/* Navigation is now handled by the Sidebar */}

        <Tabs.Content value="content" className="focus:outline-none">
          <ContentModeration />
        </Tabs.Content>

        <Tabs.Content value="tags" className="focus:outline-none">
          <TagManagement />
        </Tabs.Content>

        <Tabs.Content value="submit-forms" className="focus:outline-none">
          <Tabs.Root
            value={activeSubmitSubTab}
            onValueChange={(value) => handleSubTabChange("submit-forms", value)}
            className="space-y-6"
          >
            <Tabs.List className="flex flex-wrap gap-1 sm:gap-4 border-b border-border">
              <Tabs.Trigger
                value="form-fields"
                className="px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary focus:outline-none focus:z-10 whitespace-nowrap transition-all"
              >
                Story Form Fields
              </Tabs.Trigger>
              <Tabs.Trigger
                value="forms"
                className="px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary focus:outline-none focus:z-10 whitespace-nowrap transition-all"
              >
                Custom Forms
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="form-fields" className="focus:outline-none">
              <FormFieldManagement />
            </Tabs.Content>
            <Tabs.Content value="forms" className="focus:outline-none">
              <Forms />
            </Tabs.Content>
          </Tabs.Root>
        </Tabs.Content>

        <Tabs.Content value="judging" className="focus:outline-none">
          <Judging />
        </Tabs.Content>

        <Tabs.Content value="numbers" className="focus:outline-none">
          <NumbersView />
        </Tabs.Content>

        <Tabs.Content value="users" className="focus:outline-none">
          <Tabs.Root
            value={activeUserSubTab}
            onValueChange={(value) => handleSubTabChange("users", value)}
            className="space-y-6"
          >
            <Tabs.List className="flex flex-wrap gap-1 sm:gap-4 border-b border-border">
              <Tabs.Trigger
                value="user-moderation"
                className="px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary focus:outline-none focus:z-10 whitespace-nowrap transition-all"
              >
                Users
              </Tabs.Trigger>
              <Tabs.Trigger
                value="reports"
                className="px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary focus:outline-none focus:z-10 whitespace-nowrap transition-all"
              >
                Content Reports
              </Tabs.Trigger>
              <Tabs.Trigger
                value="user-reports"
                className="px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary focus:outline-none focus:z-10 whitespace-nowrap transition-all"
              >
                User Reports
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content
              value="user-moderation"
              className="focus:outline-none"
            >
              <UserModeration />
            </Tabs.Content>
            <Tabs.Content value="reports" className="focus:outline-none">
              <ReportManagement />
            </Tabs.Content>
            <Tabs.Content value="user-reports" className="focus:outline-none">
              <UserReportManagement />
            </Tabs.Content>
          </Tabs.Root>
        </Tabs.Content>

        <Tabs.Content value="emails" className="focus:outline-none">
          <EmailManagement />
        </Tabs.Content>

        <Tabs.Content value="settings" className="focus:outline-none">
          <Settings />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}



