"use client";

import { use } from "react";
import JudgeTrackingPage from "@/views/JudgeTrackingPage";

export default function JudgeTrackingRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <JudgeTrackingPage slug={slug} />;
}
