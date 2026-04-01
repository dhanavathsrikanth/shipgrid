"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Banner1 } from "./ui/banner";

export function IcpBanner() {
  const user = useQuery(api.users.getMyUserDocument);
  const settings = useQuery(api.settings.get);

  const shouldShow = 
    settings?.enableIcpMatching && 
    user && 
    user.username && 
    !user.icpComplete;

  if (!shouldShow) return null;

  return (
    <Banner1 
      title="Personalize your feed!"
      description="Help us show you products and founders that match your professional identity by"
      linkText="starting your discovery here"
      linkUrl="/personalize"
      defaultVisible={true}
    />
  );
}
