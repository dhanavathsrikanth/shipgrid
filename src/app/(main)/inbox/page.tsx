"use client";

import { Suspense } from "react";
import InboxPage from "@/views/InboxPage";

export default function InboxRoute() {
  return (
    <Suspense fallback={<div>Loading inbox...</div>}>
      <InboxPage />
    </Suspense>
  );
}
