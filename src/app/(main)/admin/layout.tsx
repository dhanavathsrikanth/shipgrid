"use client";

import { AdminSidebar } from "@/components/ui/sidebar";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { NotFoundPage } from "@/views/NotFoundPage";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const isUserAdmin = useQuery(
    api.users.checkIsUserAdmin,
    isAuthenticated ? {} : "skip"
  );

  if (isLoading || (isAuthenticated && isUserAdmin === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-medium">
          Loading Admin Environment...
        </div>
      </div>
    );
  }

  // Security: Only admins can see any part of the admin layout
  if (!isAuthenticated || isUserAdmin === false) {
    return <NotFoundPage />;
  }

  return (
    <div className="relative flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 pl-16 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
