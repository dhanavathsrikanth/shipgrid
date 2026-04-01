"use client";

import { useRouter } from "next/navigation";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { NotFoundPage } from "./NotFoundPage";
import { JudgeTracking } from "../components/admin/JudgeTracking";

export default function JudgeTrackingPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { isLoading: authIsLoading, isAuthenticated } = useConvexAuth();

  const isUserAdmin = useQuery(api.users.checkIsUserAdmin, isAuthenticated ? {} : "skip");
  const group = useQuery(
    api.judgingGroups.getGroupBySlug,
    slug && authIsLoading === false && isAuthenticated ? { slug } : "skip",
  );

  if (authIsLoading || (isAuthenticated && isUserAdmin === undefined)) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><div className="text-center">Loading...</div></div>;
  }

  if (!isAuthenticated || isUserAdmin === false) {
    return <NotFoundPage />;
  }

  if (group === undefined) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><div className="text-center">Loading judging group...</div></div>;
  }

  if (group === null) {
    return <NotFoundPage />;
  }

  const handleBack = () => {
    router.push("/admin?tab=judging");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <JudgeTracking groupId={group._id} groupName={group.name} onBack={handleBack} />
    </div>
  );
}
