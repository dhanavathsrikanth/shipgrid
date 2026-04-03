"use client";

import { use } from "react";
import { DynamicSubmitForm } from "@/components/DynamicSubmitForm";

export default function DynamicSubmitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <DynamicSubmitForm slug={slug} />;
}
