"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Banner1 } from "./ui/banner";

export function IcpBanner() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getMyUserDocument, isAuthenticated ? {} : "skip");
  const settings = useQuery(api.settings.get);

  const shouldShow = 
    settings?.enableIcpMatching && 
    user && 
    user.username && 
    !user.icpComplete;

  if (!shouldShow) return null;

  return (
    <Banner1 
      title="Tune your discovery."
      description="Help us tailor your feed. Complete your profile to see more relevant builders and projects"
      linkText="here"
      linkUrl="/personalize"
      defaultVisible={true}
    />
  );
}
