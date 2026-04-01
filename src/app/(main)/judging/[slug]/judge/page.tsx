"use client";

import { use } from "react";
import JudgingInterfacePage from "@/views/JudgingInterfacePage";

export default function JudgingInterfaceRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <JudgingInterfacePage slug={slug} />;
}
