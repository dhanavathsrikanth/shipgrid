"use client";

import { use } from "react";
import { FormBuilder } from "@/components/admin/FormBuilder";

export default function EditFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(params);
  return <FormBuilder formId={formId} />;
}
