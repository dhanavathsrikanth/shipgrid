"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a minimal shell on the server / before hydration to avoid mismatch
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-muted">
        <div className="flex-grow">{children}</div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}
